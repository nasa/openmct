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
 * Instruments the COMPILED single-file-component <template> render function for
 * code coverage.
 *
 * babel-plugin-istanbul keys coverage on `window.__coverage__[absolutePath]`.
 * An SFC's <script> and <template> blocks share the same absolute path, so if
 * both are instrumented under that path they collide at runtime and one wipes
 * out the other. This loader keys the template block under a DISTINCT path
 * (`<file>?template`) so both survive; a report-time step re-associates the
 * template coverage with the real file and merges it (the two blocks occupy
 * non-overlapping line ranges).
 *
 * Runs with `enforce: 'post'` and `resourceQuery: /vue&type=template/`, i.e.
 * after vue-loader has compiled the template to a render function, and threads
 * the incoming source map so coverage positions map back to the original
 * template lines in the .vue file.
 */
const { createInstrumenter, readInitialCoverage } = require('istanbul-lib-instrument');

const TEMPLATE_COVERAGE_SUFFIX = '?template';

// Exported (with the guard functions below) so a canary test can instrument a
// known fixture template through the exact same options and detection logic
// this loader uses in production, rather than a reimplementation that could
// drift from it. The production loader below also uses this constant, so
// there is one definition, not two to keep in sync.
const INSTRUMENTER_OPTIONS = {
  esModules: true,
  produceSourceMap: true,
  autoWrap: true,
  coverageVariable: '__coverage__'
};

// vue-loader's module graph routes more than the compiled render function
// through this rule — notably a re-export stub (`export * from "-!..."`). Only
// the module that actually defines a render function should be instrumented;
// instrumenting the stub would register an empty coverage object under the same
// key and clobber the real one.
function isCompiledRenderModule(content) {
  return /\bexport\s+function\s+(render|ssrRender)\b/.test(content);
}

// The re-export stub vue-loader emits for a template block. Its request carries
// an inline `-!` loader chain that already names this loader; `-!` disables pre
// and normal loaders but NOT post loaders, so this rule fires a second time on
// the module the stub points at. Recognising the stub explicitly keeps us from
// treating a genuinely unrecognised module as benign.
function isReExportStub(content) {
  return /^\s*export\s+\*\s+from\s+["']/m.test(content);
}

// Already-instrumented input means this loader has run on the module before
// (see above). Instrumenting again would nest counters and register a second,
// different-hash coverage object under the same key, where whichever executes
// last silently wins. readInitialCoverage is istanbul's own detection for this.
function isAlreadyInstrumented(content) {
  try {
    return readInitialCoverage(content) !== null;
  } catch {
    return false;
  }
}

module.exports = function istanbulTemplateLoader(content, map, meta) {
  const callback = this.async();

  // Pass through the cases we understand, and fail loudly on anything else.
  // A silent pass-through on an unrecognised module is the dangerous outcome:
  // template coverage would quietly drop to zero with no error anywhere.
  if (isAlreadyInstrumented(content) || isReExportStub(content)) {
    callback(null, content, map, meta);
    return;
  }

  if (!isCompiledRenderModule(content)) {
    callback(
      new Error(
        `istanbulTemplateLoader: unrecognised template module ${this.resourcePath}${this.resourceQuery}. ` +
          'Expected a compiled render function, a re-export stub, or already-instrumented code. ' +
          'vue-loader or @vue/compiler-sfc probably changed its output shape; template coverage ' +
          'would otherwise silently stop being collected. First 200 chars:\n' +
          content.slice(0, 200)
      )
    );
    return;
  }

  // Positions are mapped back to the .vue source through this map. Without it
  // branch locations would be attributed to compiled render-function lines,
  // silently corrupting which source lines the coverage points at.
  if (!map) {
    callback(
      new Error(
        `istanbulTemplateLoader: no input source map for ${this.resourcePath}${this.resourceQuery}. ` +
          'Template branch positions could not be mapped back to the .vue source. ' +
          "Check that the coverage build's devtool still produces per-loader source maps."
      )
    );
    return;
  }

  const coverageKey = `${this.resourcePath}${TEMPLATE_COVERAGE_SUFFIX}`;

  const instrumenter = createInstrumenter(INSTRUMENTER_OPTIONS);

  instrumenter.instrument(
    content,
    coverageKey,
    (error, instrumentedCode) => {
      if (error) {
        callback(error);
        return;
      }
      callback(null, instrumentedCode, instrumenter.lastSourceMap() || map, meta);
    },
    map
  );
};

module.exports.TEMPLATE_COVERAGE_SUFFIX = TEMPLATE_COVERAGE_SUFFIX;
module.exports.INSTRUMENTER_OPTIONS = INSTRUMENTER_OPTIONS;
module.exports.isCompiledRenderModule = isCompiledRenderModule;
module.exports.isReExportStub = isReExportStub;
module.exports.isAlreadyInstrumented = isAlreadyInstrumented;
module.exports.createTemplateInstrumenter = () => createInstrumenter(INSTRUMENTER_OPTIONS);
