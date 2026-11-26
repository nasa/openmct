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
 * Fails loudly when vue-loader or @vue/compiler-sfc drift from the exact
 * versions the SFC <template> coverage mechanism was last validated against.
 *
 * Why: istanbulTemplateLoader.cjs recognises the compiled render function and
 * re-export stub by matching vue-loader's current output shape.
 * stripTemplateCoverage.cjs finds template line ranges via
 * @vue/compiler-sfc's parse(). The cacheHandlers:false override in
 * webpack.coverage.mjs depends on @vue/compiler-sfc's compileTemplate
 * defaults, and disabling it was what took ~77% of measured template branch
 * legs from compiler artifacts (see TESTING.md) down to genuine ones. None of
 * this is covered by semver: a version bump could change the compiled output
 * shape, or silently change cacheHandlers' default or behavior, without
 * erroring anywhere -- coverage would just quietly become noisier or sparser
 * again. package.json already pins both packages to exact versions (no `^`),
 * so this only fires on a deliberate bump, not a transitive drift -- but nyc
 * dependency version bumps to *this* package have caused exactly this kind of
 * silent-degradation-of-a-derived-tool bug once already in this file's
 * history (see stripTemplateCoverage.cjs's karma vs nyc json-shape note).
 *
 * Usage: called at webpack.coverage.mjs module-eval time, so a version bump
 * fails the coverage build immediately instead of shipping silently-different
 * branch coverage. When it fires: re-run the unit + e2e template branch
 * coverage comparison described in TESTING.md, then update PINNED_VERSIONS
 * below to the new versions.
 */
const PINNED_VERSIONS = {
  'vue-loader': '16.8.3',
  '@vue/compiler-sfc': '3.4.3'
};

function installedVersion(pkg) {
  return require(`${pkg}/package.json`).version;
}

function assertPinnedCoverageDependencies(pinned = PINNED_VERSIONS) {
  const problems = Object.entries(pinned)
    .map(([pkg, expected]) => [pkg, expected, installedVersion(pkg)])
    .filter(([, expected, actual]) => actual !== expected)
    .map(([pkg, expected, actual]) => `${pkg}@${actual} (expected ${expected})`);

  if (problems.length) {
    throw new Error(
      `assertPinnedCoverageDependencies: ${problems.join(', ')}. The SFC <template> ` +
        'coverage mechanism (istanbulTemplateLoader.cjs, stripTemplateCoverage.cjs, and the ' +
        'cacheHandlers override in webpack.coverage.mjs) is validated against exact versions ' +
        'of these packages because its correctness depends on their compiled output shape and ' +
        'compiler defaults, not just their public API. Re-run the unit + e2e template branch ' +
        'coverage comparison in TESTING.md, then update PINNED_VERSIONS in this file.'
    );
  }
}

module.exports = { assertPinnedCoverageDependencies, PINNED_VERSIONS, installedVersion };
