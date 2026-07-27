/*
This file extends the webpack.dev.mjs config to add babel istanbul coverage.
OpenMCT Continuous Integration servers use this configuration to add code coverage
information to pull requests.
*/

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import config from './webpack.dev.mjs';

const require = createRequire(import.meta.url);
const {
  assertPinnedCoverageDependencies
} = require('./coverage/assertPinnedCoverageDependencies.cjs');

// Fails the coverage build immediately if vue-loader or @vue/compiler-sfc have
// drifted from the versions this mechanism was validated against, rather than
// letting branch coverage silently change shape. See the module for why.
assertPinnedCoverageDependencies();

const templateCoverageLoader = fileURLToPath(
  new URL('./coverage/istanbulTemplateLoader.cjs', import.meta.url)
);

config.devtool = 'inline-source-map';
config.devServer.hot = false;

// Disable Vue's event-handler caching for the coverage build only. With it on
// (the @vue/compiler-sfc default) every `@click`-style binding compiles to
// `_cache[n] || (_cache[n] = handler)`, which istanbul records as a two-leg
// branch. Both legs are taken on the component's very first render, so the
// branch reports "was this component instantiated" — a bit the <script> block's
// line coverage already gives us — rather than anything about the handler. No
// test can move it, and it accounted for 77% of all template branch legs.
// Production builds keep the optimization.
const vueRule = config.module.rules.find((rule) => rule.loader === 'vue-loader');
if (!vueRule) {
  throw new Error(
    'webpack.coverage: no vue-loader rule found to disable cacheHandlers on. The base ' +
      'config changed shape; template branch coverage would silently regress to noise.'
  );
}
vueRule.options = {
  ...vueRule.options,
  compilerOptions: {
    ...vueRule.options?.compilerOptions,
    cacheHandlers: false
  }
};

config.module.rules.push({
  test: /\.js$/,
  // Exclude compiled SFC <template> blocks: vue-loader would otherwise clone
  // this rule onto them, instrumenting the template render function under the
  // same coverage key as the <script> block (they share the .vue path) — the
  // two then collide at runtime. Template blocks are handled by the dedicated
  // loader below, which keys them distinctly.
  exclude: /(Spec\.js$)|(node_modules)/,
  resourceQuery: { not: [/vue&type=template/] },
  use: {
    loader: 'babel-loader',
    options: {
      retainLines: true,
      plugins: [
        [
          'babel-plugin-istanbul',
          {
            extension: ['.js', '.vue']
          }
        ]
      ]
    }
  }
});

// Instrument compiled SFC <template> render functions under a distinct coverage
// key so template branch coverage survives alongside the <script> block.
config.module.rules.push({
  resourceQuery: /vue&type=template/,
  enforce: 'post',
  use: {
    loader: templateCoverageLoader
  }
});

export default config;
