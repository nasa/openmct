/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/*
 * Filters SFC <template> blocks out of a coverage-final.json (an
 * istanbul-lib-coverage CoverageMap, already remapped and merged by the karma
 * or nyc reporter) so they contribute BRANCH coverage only, then regenerates
 * lcov.info from the filtered map.
 *
 * Why the coverage-map layer instead of post-processing lcov text: lcov loses
 * information istanbul itself has. Function entries are matched to their hit
 * counts by NAME in lcov, and istanbul names anonymous functions per block, so
 * a template's and script's generated names can collide once merged -- lcov
 * gives no way to tell them apart except positionally. Statement/line
 * counters (LF/LH etc.) have to be hand-recomputed from the surviving DA
 * records. Both of those were real bugs in an earlier, lcov-text version of
 * this script. Here, functions and statements are keyed by istanbul's own
 * numeric ids, so filtering means deleting the (id -> location) entry and the
 * matching (id -> hits) entry -- no name matching, no manual counter math.
 * istanbul-lib-report regenerates LF/LH/BRF/BRH/FNF/FNH from the filtered
 * object the same way it always does.
 *
 * Usage: node stripTemplateCoverage.cjs <coverage-final.json> <outDir> [repoRoot]
 */
const fs = require('node:fs');
const path = require('node:path');

const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const { parse } = require('@vue/compiler-sfc');

const TEMPLATE_RANGE_CACHE = new Map();

// Returns [startLine, endLine] for the component's <template>, or null when
// the component genuinely has no template block. Throws when the file cannot
// be read or parsed: that means the range is unknown, and silently treating
// it as "no template" would leave the template's statements and functions in
// the report, inflating line coverage with no warning.
function templateRangeFor(absFile) {
  if (TEMPLATE_RANGE_CACHE.has(absFile)) {
    return TEMPLATE_RANGE_CACHE.get(absFile);
  }
  let source;
  try {
    source = fs.readFileSync(absFile, 'utf8');
  } catch (error) {
    throw new Error(
      `stripTemplateCoverage: cannot read ${absFile}, referenced by the coverage report. ` +
        `The template line range is unknown, so its coverage cannot be filtered. Cause: ${error.message}`
    );
  }
  const { descriptor, errors } = parse(source, { filename: absFile });
  if (errors && errors.length) {
    throw new Error(`stripTemplateCoverage: cannot parse ${absFile}: ${errors[0].message}`);
  }
  const range = descriptor.template
    ? [descriptor.template.loc.start.line, descriptor.template.loc.end.line]
    : null;
  TEMPLATE_RANGE_CACHE.set(absFile, range);
  return range;
}

function inRange(loc, range) {
  return loc.start.line >= range[0] && loc.start.line <= range[1];
}

// A function's reported line is `decl` when present, falling back to `loc`
// (its body) -- the same fallback istanbul-reports' lcovonly writer uses for
// FN:, so a function is dropped exactly when its FN: record would have been.
function functionLoc(meta) {
  return meta.decl || meta.loc;
}

// Drops template-range statementMap/fnMap entries (and their s/f hit counts)
// from one file's raw coverage-final.json entry. branchMap/b is always kept
// in full, template or not -- branch coverage is the metric this mechanism
// exists to capture.
function filterFileCoverage(fc, range) {
  const statementMap = {};
  const s = {};
  for (const [id, loc] of Object.entries(fc.statementMap)) {
    if (!inRange(loc, range)) {
      statementMap[id] = loc;
      s[id] = fc.s[id];
    }
  }

  const fnMap = {};
  const f = {};
  for (const [id, meta] of Object.entries(fc.fnMap)) {
    if (!inRange(functionLoc(meta), range)) {
      fnMap[id] = meta;
      f[id] = fc.f[id];
    }
  }

  return { ...fc, statementMap, s, fnMap, f };
}

// karma-coverage-istanbul-reporter's `json` report and nyc's `json` report are
// NOT the same shape, despite both nominally being "coverage-final.json" from
// the istanbul family. nyc's entries are the raw FileCoverage data directly
// ({path, statementMap, ...}). karma's are double-wrapped as
// {data: {path, statementMap, ...}}.
//
// Root cause: karma-coverage-istanbul-reporter bundles its own
// istanbul-lib-source-maps@3.0.6 (root uses 4.0.1), which in turn bundles its
// OWN istanbul-lib-coverage@2.0.5 (root uses 3.2.2) -- a third, older, physically
// distinct copy of the library. That old FileCoverage class does not implement
// the `toJSON() { return this.data }` unwrap that later versions do, so
// JSON.stringify-ing one of its instances serializes its only own property,
// `data`, as-is. This is entirely a karma-coverage-istanbul-reporter/
// istanbul-lib-source-maps dependency quirk; nyc's own dependency tree has no
// such duplication.
//
// A raw FileCoverage object always has `.path`; recognise the wrapped shape by
// its absence and unwrap, rather than special-casing "karma vs nyc" by name --
// that keeps this correct if either tool's behavior changes.
function unwrapFileCoverage(entry, file) {
  if (entry && typeof entry === 'object' && entry.path) {
    return entry;
  }
  if (entry && typeof entry === 'object' && entry.data && entry.data.path) {
    return entry.data;
  }
  throw new Error(
    `stripTemplateCoverage: coverage entry for ${file} has neither a top-level ` +
      '.path nor a .data.path -- unrecognised coverage-final.json shape.'
  );
}

// Filters every .vue entry in a raw coverage-final.json object. Non-.vue
// entries and .vue entries with no <template> block pass through unchanged.
function filterCoverageMap(rawJson, repoRoot) {
  const out = {};
  for (const [file, rawEntry] of Object.entries(rawJson)) {
    const fc = unwrapFileCoverage(rawEntry, file);
    if (!file.endsWith('.vue')) {
      out[file] = fc;
      continue;
    }
    const range = templateRangeFor(path.resolve(repoRoot, file));
    out[file] = range ? filterFileCoverage(fc, range) : fc;
  }
  return out;
}

// Re-reads the filtered CoverageMap and fails on anything that would make the
// regenerated report wrong or unusable downstream, rather than degrading
// silently. These are the invariants the mechanism rests on.
function verifyCoverageMap(coverageMap, repoRoot) {
  const problems = [];

  coverageMap.files().forEach((file) => {
    if (file.includes('?')) {
      // A `<file>?template` key that was never remapped onto its real
      // source. codecov silently drops such paths, so the coverage would
      // just vanish.
      problems.push(`phantom source path (never remapped): ${file}`);
      return;
    }
    if (!file.endsWith('.vue')) {
      return;
    }
    const range = templateRangeFor(path.resolve(repoRoot, file));
    if (!range) {
      return;
    }
    const fc = coverageMap.fileCoverageFor(file);
    const survivingStatements = Object.values(fc.statementMap).filter((loc) =>
      inRange(loc, range)
    ).length;
    const survivingFns = Object.values(fc.fnMap).filter((meta) =>
      inRange(functionLoc(meta), range)
    ).length;
    if (survivingStatements > 0) {
      problems.push(
        `${file}: ${survivingStatements} template-range statements survived the filter`
      );
    }
    if (survivingFns > 0) {
      problems.push(`${file}: ${survivingFns} template-range functions survived the filter`);
    }
  });

  if (problems.length) {
    throw new Error(
      `stripTemplateCoverage: filtered coverage map failed verification ` +
        `(${problems.length} problem(s)):\n  ` +
        problems.slice(0, 10).join('\n  ') +
        (problems.length > 10 ? `\n  ...and ${problems.length - 10} more` : '')
    );
  }
}

// `lcovonly` is what gets uploaded; `text-summary` prints the same totals to
// stdout so every run shows the numbers codecov will report. Any other
// istanbul reporter can be requested via --reporters (see main), which is how
// you get a browsable local report -- see the cov:*:html scripts.
//
// Everything here renders from the FILTERED map. Running a reporter against
// the raw coverage-final.json instead would include the template statements
// and functions this script exists to remove, and silently disagree with the
// uploaded lcov (measured: ~0.6pt on lines, ~1.9pt on functions).
const DEFAULT_REPORTERS = ['lcovonly', 'text-summary'];

function writeReports(coverageMap, outDir, repoRoot, reporterNames) {
  const context = libReport.createContext({ dir: outDir, coverageMap });
  reporterNames.forEach((name) => {
    // lcovonly needs an explicit filename; the rest use their own defaults.
    const options =
      name === 'lcovonly'
        ? { file: 'lcov.info', projectRoot: repoRoot }
        : { projectRoot: repoRoot };
    reports.create(name, options).execute(context);
  });
}

function main() {
  const args = process.argv.slice(2);
  const reportersFlag = args.find((arg) => arg.startsWith('--reporters='));
  const [jsonPath, outDir, repoRoot = process.cwd()] = args.filter((arg) => !arg.startsWith('--'));
  const requestedReporters = reportersFlag
    ? reportersFlag.slice('--reporters='.length).split(',').filter(Boolean)
    : [];
  // An empty or malformed --reporters= would otherwise write no report at all
  // and still exit 0, which for a coverage step is a silent no-op.
  const reporterNames = requestedReporters.length ? requestedReporters : DEFAULT_REPORTERS;

  if (!jsonPath || !outDir) {
    console.error(
      'usage: node stripTemplateCoverage.cjs <coverage-final.json> <outDir> [repoRoot] ' +
        `[--reporters=a,b] (default: ${DEFAULT_REPORTERS.join(',')})`
    );
    process.exit(1);
  }
  // Run as a post-test/post-report hook: a missing report (e.g. a debug run
  // that produced no coverage) is a no-op, not an error.
  if (!fs.existsSync(jsonPath)) {
    console.log(`No coverage report at ${jsonPath}; skipping template filter.`);
    return;
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const filtered = filterCoverageMap(raw, repoRoot);
  const coverageMap = libCoverage.createCoverageMap(filtered);

  verifyCoverageMap(coverageMap, repoRoot);
  fs.mkdirSync(outDir, { recursive: true });
  writeReports(coverageMap, outDir, repoRoot, reporterNames);
  console.log(`Wrote template-filtered ${reporterNames.join(', ')} to ${outDir}`);
}

if (require.main === module) {
  main();
}

module.exports = { filterCoverageMap, filterFileCoverage, verifyCoverageMap, templateRangeFor };
