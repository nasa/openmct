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
 * A canary for silent drift in vue-loader/@vue/compiler-sfc's compiled output
 * shape, or in the coverage build's compiler options -- the two things
 * assertPinnedCoverageDependencies.cjs's version pin protects against a
 * DELIBERATE bump of, but not against those versions' actual behavior
 * changing in some way this repo never re-validates, or someone editing
 * webpack.coverage.mjs's compilerOptions without realizing it affects
 * coverage.
 *
 * Compiles a known fixture template through the REAL coverage config's
 * compilerOptions (read from webpack.coverage.mjs, not duplicated here, so
 * this can't silently drift from what the coverage build actually does), then
 * instruments it through istanbulTemplateLoader.cjs's actual detection logic
 * and instrumenter options -- not a reimplementation of either. Asserts an
 * exact, hand-verified branch shape.
 *
 * These are node-side tests for a build script, so they use node:test rather
 * than the karma/jasmine suite, which runs specs in a browser.
 */
const assert = require('node:assert');
const path = require('node:path');
const { describe, it } = require('node:test');

const { compileTemplate } = require('@vue/compiler-sfc');

const loader = require('./istanbulTemplateLoader.cjs');

const REPO_ROOT = path.join(__dirname, '..', '..');

// Deliberately exercises: a v-if/v-else pair, a ternary in an interpolation,
// and an event handler binding. Hand-verified compiled output (see the
// comment on FIXTURE_EXPECTED_BRANCHES below) shows this compiles to exactly
// two `cond-expr` branches (the v-if/v-else and the ternary) and, because the
// coverage build disables cacheHandlers, ZERO branches from the handler --
// with it enabled, this same fixture produces a THIRD branch group (a
// two-leg `_cache[n] || (...)`  binary-expr) that carries no test information
// (see the cacheHandlers comment in webpack.coverage.mjs). That absence is
// itself part of what this canary checks: it would catch cacheHandlers ever
// being silently re-enabled, same as it would catch vue-loader/compiler-sfc
// changing what a v-if compiles to.
const FIXTURE_TEMPLATE = `<div>
    <span v-if="visible">{{ label }}</span>
    <span v-else>hidden</span>
    <button @click="onClick">{{ active ? 'On' : 'Off' }}</button>
  </div>`;

// Hand-verified against the real coverage compilerOptions (hoistStatic:
// false, whitespace: preserve, cacheHandlers: false) by running the fixture
// through compileTemplate + istanbulTemplateLoader's real instrumenter and
// inspecting instrumenter.lastFileCoverage().branchMap directly. Do not
// "fix" this to match a changed result without first confirming *why* it
// changed -- that is precisely what this canary exists to force.
const FIXTURE_EXPECTED_BRANCHES = {
  groups: 2,
  legs: 4,
  types: { 'cond-expr': 2 }
};

describe('template coverage canary', () => {
  it('compiles the fixture through the real coverage build compilerOptions without error', async () => {
    const compilerOptions = await coverageCompilerOptions();
    const compiled = compileFixture(compilerOptions);

    assert.deepStrictEqual(compiled.errors, []);
  });

  it('is recognised by the loader as a compiled render module', async () => {
    const compilerOptions = await coverageCompilerOptions();
    const compiled = compileFixture(compilerOptions);

    assert.strictEqual(loader.isCompiledRenderModule(compiled.code), true);
  });

  it('produces exactly the hand-verified branch shape', async () => {
    const compilerOptions = await coverageCompilerOptions();
    const compiled = compileFixture(compilerOptions);

    const instrumenter = loader.createTemplateInstrumenter();
    instrumenter.instrumentSync(compiled.code, fixturePath() + '?template', compiled.map);
    const fileCoverage = instrumenter.lastFileCoverage();

    const branches = Object.values(fileCoverage.branchMap);
    const legs = branches.reduce((sum, b) => sum + b.locations.length, 0);
    const types = {};
    branches.forEach((b) => {
      types[b.type] = (types[b.type] || 0) + 1;
    });

    assert.strictEqual(branches.length, FIXTURE_EXPECTED_BRANCHES.groups, 'branch group count');
    assert.strictEqual(legs, FIXTURE_EXPECTED_BRANCHES.legs, 'branch leg count');
    assert.deepStrictEqual(types, FIXTURE_EXPECTED_BRANCHES.types, 'branch type histogram');

    // No `binary-expr` branches: the cacheHandlers artifact this fixture's
    // event handler would produce if the coverage build re-enabled it.
    assert.strictEqual(types['binary-expr'], undefined, 'no cacheHandlers-artifact branches');
  });

  it('every branch location falls within the compiled render function', async () => {
    const compilerOptions = await coverageCompilerOptions();
    const compiled = compileFixture(compilerOptions);
    const compiledLineCount = compiled.code.split('\n').length;

    const instrumenter = loader.createTemplateInstrumenter();
    instrumenter.instrumentSync(compiled.code, fixturePath() + '?template', compiled.map);
    const fileCoverage = instrumenter.lastFileCoverage();

    Object.values(fileCoverage.branchMap).forEach((b) => {
      assert.ok(b.loc.start.line >= 1 && b.loc.start.line <= compiledLineCount);
    });
  });
});

async function coverageCompilerOptions() {
  // no-unsanitized/method is a DOM/XSS rule flagging dynamic import() generally;
  // this path is a fixed join of __dirname and a literal filename, not user input.
  // A dynamic import (rather than require) is required here because
  // webpack.coverage.mjs is ESM and this spec file is CJS.
  // eslint-disable-next-line no-unsanitized/method
  const config = (await import(path.join(REPO_ROOT, '.webpack', 'webpack.coverage.mjs'))).default;
  const vueRule = config.module.rules.find((rule) => rule.loader === 'vue-loader');
  assert.ok(vueRule, 'webpack.coverage.mjs must still have a vue-loader rule');
  return vueRule.options.compilerOptions;
}

function fixturePath() {
  return path.join(__dirname, '__templateCoverageCanaryFixture.vue');
}

function compileFixture(compilerOptions) {
  return compileTemplate({
    source: FIXTURE_TEMPLATE,
    filename: fixturePath(),
    id: 'canary',
    compilerOptions: { mode: 'module', ...compilerOptions }
  });
}
