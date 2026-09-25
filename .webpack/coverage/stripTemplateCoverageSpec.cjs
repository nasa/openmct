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
 * Run with: npm run test:coverage-tooling
 *
 * These are node-side tests for a build script, so they use node:test rather
 * than the karma/jasmine suite, which runs specs in a browser.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

const libCoverage = require('istanbul-lib-coverage');

const {
  filterCoverageMap,
  filterFileCoverage,
  verifyCoverageMap,
  templateRangeFor
} = require('./stripTemplateCoverage.cjs');

// A component whose <template> occupies lines 1-3 and <script> lines 5-9.
const WITH_TEMPLATE = `<template>
  <div v-if="visible">{{ label }}</div>
</template>

<script>
export default {
  data() {
    return { visible: true, label: 'x' };
  }
};
</script>
`;

const WITHOUT_TEMPLATE = `<script>
export default {
  data() {
    return {};
  }
};
</script>
`;

let fixtureRoot;
let withTemplatePath;
let noTemplatePath;

function loc(startLine, endLine = startLine) {
  return { start: { line: startLine, column: 0 }, end: { line: endLine, column: 10 } };
}

// A minimal, valid raw FileCoverage object (the flat shape nyc's json report
// emits): every id referenced by statementMap/fnMap/branchMap has a matching
// hit-count entry, as istanbul itself guarantees.
function fileCoverage(file, { statements = {}, fns = {}, branches = {} } = {}) {
  const statementMap = {};
  const s = {};
  Object.entries(statements).forEach(([id, { line, hits }]) => {
    statementMap[id] = loc(line);
    s[id] = hits;
  });

  const fnMap = {};
  const f = {};
  Object.entries(fns).forEach(([id, { line, hits, name }]) => {
    fnMap[id] = { name: name || `(anonymous_${id})`, decl: loc(line), loc: loc(line) };
    f[id] = hits;
  });

  const branchMap = {};
  const b = {};
  Object.entries(branches).forEach(([id, { line, hits, type }]) => {
    branchMap[id] = { type: type || 'if', loc: loc(line), locations: hits.map(() => loc(line)) };
    b[id] = hits;
  });

  return { path: file, statementMap, fnMap, branchMap, s, f, b };
}

describe('stripTemplateCoverage', () => {
  before(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-template-coverage-'));
    withTemplatePath = path.join(fixtureRoot, 'WithTemplate.vue');
    noTemplatePath = path.join(fixtureRoot, 'NoTemplate.vue');
    fs.writeFileSync(withTemplatePath, WITH_TEMPLATE);
    fs.writeFileSync(noTemplatePath, WITHOUT_TEMPLATE);
  });

  after(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it('finds the template line range via @vue/compiler-sfc', () => {
    assert.deepStrictEqual(templateRangeFor(withTemplatePath), [1, 3]);
    assert.strictEqual(templateRangeFor(noTemplatePath), null);
  });

  it('leaves non-.vue entries untouched', () => {
    const fc = fileCoverage('some/module.js', {
      statements: { 0: { line: 5, hits: 3 }, 1: { line: 6, hits: 0 } }
    });
    const filtered = filterCoverageMap({ 'some/module.js': fc }, fixtureRoot);

    assert.deepStrictEqual(filtered['some/module.js'], fc);
  });

  it('leaves a component with no <template> untouched', () => {
    const fc = fileCoverage(noTemplatePath, { statements: { 0: { line: 3, hits: 1 } } });
    const filtered = filterCoverageMap({ [noTemplatePath]: fc }, fixtureRoot);

    assert.deepStrictEqual(filtered[noTemplatePath], fc);
  });

  it('drops template-range statements and keeps script ones, by numeric id', () => {
    const fc = fileCoverage(withTemplatePath, {
      statements: {
        0: { line: 2, hits: 7 }, // inside <template>
        1: { line: 7, hits: 3 } // inside <script>
      }
    });
    const filtered = filterFileCoverage(fc, templateRangeFor(withTemplatePath));

    assert.deepStrictEqual(Object.keys(filtered.statementMap), ['1']);
    assert.strictEqual(filtered.s['1'], 3);
    assert.strictEqual(filtered.s['0'], undefined);
  });

  it('drops template-range functions and keeps script ones, by numeric id', () => {
    const fc = fileCoverage(withTemplatePath, {
      fns: {
        0: { line: 2, hits: 5 }, // template
        1: { line: 7, hits: 2 } // script
      }
    });
    const filtered = filterFileCoverage(fc, templateRangeFor(withTemplatePath));

    assert.deepStrictEqual(Object.keys(filtered.fnMap), ['1']);
    assert.strictEqual(filtered.f['1'], 2);
    assert.strictEqual(filtered.f['0'], undefined);
  });

  // Regression scenario for the lcov-text version of this script: istanbul
  // names anonymous functions per block, so a template's and script's function
  // can share the generated name "(anonymous_1)" once merged. Filtering by
  // numeric id rather than by name means the collision cannot happen at all --
  // this asserts the script's entry survives even when both share a name.
  it('is unaffected by template/script functions sharing a generated name', () => {
    const fc = fileCoverage(withTemplatePath, {
      fns: {
        0: { line: 2, hits: 5, name: '(anonymous_1)' }, // template
        1: { line: 7, hits: 2, name: '(anonymous_1)' } // script, same name
      }
    });
    const filtered = filterFileCoverage(fc, templateRangeFor(withTemplatePath));

    assert.strictEqual(Object.keys(filtered.fnMap).length, 1);
    assert.strictEqual(filtered.f['1'], 2);
  });

  it('always preserves branch entries, including template ones', () => {
    const fc = fileCoverage(withTemplatePath, {
      branches: { 0: { line: 2, hits: [4, 0], type: 'if' } } // template v-if
    });
    const filtered = filterFileCoverage(fc, templateRangeFor(withTemplatePath));

    assert.deepStrictEqual(filtered.branchMap, fc.branchMap);
    assert.deepStrictEqual(filtered.b, fc.b);
  });

  // Regression test for karma-coverage-istanbul-reporter's json report, which
  // double-wraps each entry as {data: {...}} due to a bundled, older, physically
  // distinct copy of istanbul-lib-coverage. nyc's json report does not do this.
  it('unwraps karma-coverage-istanbul-reporter-style {data: ...} entries', () => {
    const fc = fileCoverage(noTemplatePath, { statements: { 0: { line: 3, hits: 1 } } });
    const filtered = filterCoverageMap({ [noTemplatePath]: { data: fc } }, fixtureRoot);

    assert.deepStrictEqual(filtered[noTemplatePath], fc);
  });

  it('rejects an entry with neither a top-level nor nested .path', () => {
    assert.throws(
      () => filterCoverageMap({ 'some/module.js': { nonsense: true } }, fixtureRoot),
      /unrecognised coverage-final\.json shape/
    );
  });

  describe('verifyCoverageMap', () => {
    it('passes a correctly filtered map', () => {
      const fc = fileCoverage(withTemplatePath, {
        statements: { 0: { line: 7, hits: 1 } },
        branches: { 0: { line: 2, hits: [4, 0] } }
      });
      const coverageMap = libCoverage.createCoverageMap({ [withTemplatePath]: fc });

      assert.doesNotThrow(() => verifyCoverageMap(coverageMap, fixtureRoot));
    });

    it('rejects a phantom ?query source path', () => {
      const fc = fileCoverage(`${withTemplatePath}?template`, {
        statements: { 0: { line: 7, hits: 1 } }
      });
      const coverageMap = libCoverage.createCoverageMap({ [`${withTemplatePath}?template`]: fc });

      assert.throws(() => verifyCoverageMap(coverageMap, fixtureRoot), /phantom source path/);
    });

    it('rejects a map where template-range statements were not actually filtered', () => {
      // Simulates a bug in filterFileCoverage: template statement left in place.
      const fc = fileCoverage(withTemplatePath, { statements: { 0: { line: 2, hits: 1 } } });
      const coverageMap = libCoverage.createCoverageMap({ [withTemplatePath]: fc });

      assert.throws(
        () => verifyCoverageMap(coverageMap, fixtureRoot),
        /template-range statements survived/
      );
    });

    it('rejects a map where template-range functions were not actually filtered', () => {
      const fc = fileCoverage(withTemplatePath, { fns: { 0: { line: 2, hits: 1 } } });
      const coverageMap = libCoverage.createCoverageMap({ [withTemplatePath]: fc });

      assert.throws(
        () => verifyCoverageMap(coverageMap, fixtureRoot),
        /template-range functions survived/
      );
    });
  });

  it('throws when a referenced .vue file cannot be read', () => {
    const missing = path.join(fixtureRoot, 'Missing.vue');
    const fc = fileCoverage(missing, { statements: { 0: { line: 1, hits: 1 } } });

    assert.throws(() => filterCoverageMap({ [missing]: fc }, fixtureRoot), /cannot read/);
  });

  it('is idempotent: filtering an already-filtered map changes nothing', () => {
    const fc = fileCoverage(withTemplatePath, {
      statements: { 0: { line: 2, hits: 7 }, 1: { line: 7, hits: 3 } },
      fns: { 0: { line: 2, hits: 5 }, 1: { line: 7, hits: 2 } },
      branches: { 0: { line: 2, hits: [4, 0] } }
    });
    const once = filterCoverageMap({ [withTemplatePath]: fc }, fixtureRoot);
    const twice = filterCoverageMap(once, fixtureRoot);

    assert.deepStrictEqual(twice, once);
  });
});
