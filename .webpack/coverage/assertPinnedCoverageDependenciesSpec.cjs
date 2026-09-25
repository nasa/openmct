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
const { describe, it } = require('node:test');

const {
  assertPinnedCoverageDependencies,
  PINNED_VERSIONS,
  installedVersion
} = require('./assertPinnedCoverageDependencies.cjs');

describe('assertPinnedCoverageDependencies', () => {
  it('does not throw when every pinned package matches its installed version', () => {
    assert.doesNotThrow(() => assertPinnedCoverageDependencies());
  });

  it('PINNED_VERSIONS matches what is actually installed right now', () => {
    // Fails the moment package.json's pin for either package changes without
    // this file being updated to match -- exactly the drift this module
    // exists to catch, surfaced here instead of only at webpack-config-load time.
    for (const [pkg, expected] of Object.entries(PINNED_VERSIONS)) {
      assert.strictEqual(
        installedVersion(pkg),
        expected,
        `${pkg} is pinned to ${expected} here but ${installedVersion(pkg)} is installed`
      );
    }
  });

  it('throws naming the package and both versions on a mismatch', () => {
    assert.throws(
      () => assertPinnedCoverageDependencies({ 'vue-loader': '0.0.0-does-not-match' }),
      /vue-loader@16\.8\.3 \(expected 0\.0\.0-does-not-match\)/
    );
  });

  it('reports every mismatched package, not just the first', () => {
    assert.throws(
      () =>
        assertPinnedCoverageDependencies({
          'vue-loader': '0.0.0-a',
          '@vue/compiler-sfc': '0.0.0-b'
        }),
      (error) => error.message.includes('vue-loader') && error.message.includes('@vue/compiler-sfc')
    );
  });

  it('does not throw for a package pinned to its actual installed version', () => {
    assert.doesNotThrow(() =>
      assertPinnedCoverageDependencies({ 'vue-loader': installedVersion('vue-loader') })
    );
  });
});
