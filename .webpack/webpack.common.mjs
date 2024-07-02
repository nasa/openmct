/*
This is the OpenMCT common webpack file. It is imported by the other three webpack configurations:
 - webpack.prod.mjs - the production configuration for OpenMCT (default)
 - webpack.dev.mjs - the development configuration for OpenMCT
 - webpack.coverage.mjs - imports webpack.dev.js and adds code coverage
There are separate npm scripts to use these configurations, though simply running `npm install`
will use the default production configuration.
*/
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
let gitRevision = 'error-retrieving-revision';
let gitBranch = 'error-retrieving-branch';

const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

try {
  gitRevision = execSync('git rev-parse HEAD').toString().trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch (err) {
  console.warn(err);
}

const projectRootDir = fileURLToPath(new URL('../', import.meta.url));

/** @type {import('webpack').Configuration} */
const config = {
  context: projectRootDir,
  devServer: {
    client: {
      progress: true,
      overlay: {
        // Disable overlay for runtime errors.
        // See: https://github.com/webpack/webpack-dev-server/issues/4771
        runtimeErrors: false
      }
    }
  },
  entry: {
    openmct: './openmct.js',
    generatorWorker: './example/generator/generatorWorker.js',
    couchDBChangesFeed: './src/plugins/persistence/couch/CouchChangesFeed.js',
    inMemorySearchWorker: './src/api/objects/InMemorySearchWorker.js',
    espressoTheme: './src/plugins/themes/espresso-theme.scss',
    snowTheme: './src/plugins/themes/snow-theme.scss',
    darkmatterTheme: './src/plugins/themes/darkmatter-theme.scss'
  },
  output: {
    globalObject: 'this',
    filename: '[name].js',
    path: path.resolve(projectRootDir, 'dist'),
    library: {
      name: 'openmct',
      type: 'umd',
      export: 'default'
    },
    publicPath: '',
    hashFunction: 'xxhash64',
    clean: true
  },
  resolve: {
    alias: {
      '@': path.join(projectRootDir, 'src'),
      legacyRegistry: path.join(projectRootDir, 'src/legacyRegistry'),
      csv: 'comma-separated-values',
      EventEmitter: 'eventemitter3',
      bourbon: 'bourbon.scss',
      'plotly-basic': 'plotly.js-basic-dist-min',
      'plotly-gl2d': 'plotly.js-gl2d-dist-min',
      printj: 'printj/printj.mjs',
      styles: path.join(projectRootDir, 'src/styles'),
      MCT: path.join(projectRootDir, 'src/MCT'),
      testUtils: path.join(projectRootDir, 'src/utils/testUtils.js'),
      objectUtils: path.join(projectRootDir, 'src/api/objects/object-utils.js'),
      utils: path.join(projectRootDir, 'src/utils'),
      vue: 'vue/dist/vue.esm-bundler'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      __OPENMCT_VERSION__: `'${version}'`,
      __OPENMCT_BUILD_DATE__: `'${new Date()}'`,
      __OPENMCT_REVISION__: `'${gitRevision}'`,
      __OPENMCT_BUILD_BRANCH__: `'${gitBranch}'`,
      __VUE_OPTIONS_API__: true, // enable/disable Options API support, default: true
      __VUE_PROD_DEVTOOLS__: false // enable/disable devtools support in production, default: false
    }),
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/images/favicons',
          to: 'favicons'
        },
        {
          from: './index.html',
          transform: function (content) {
            return content.toString().replace(/dist\//g, '');
          }
        },
        {
          from: 'src/plugins/imagery/layers',
          to: 'imagery'
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css'
    }),
    // Add a UTF-8 BOM to CSS output to avoid random mojibake
    new webpack.BannerPlugin({
      test: /.*Theme\.css$/,
      raw: true,
      banner: '@charset "UTF-8";'
    })
  ],
  module: {
    rules: [
      {
        test: /\.(sc|sa|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'resolve-url-loader'
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: true }
          }
        ]
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            hoistStatic: false,
            whitespace: 'preserve'
          }
        }
      },
      {
        test: /\.html$/,
        type: 'asset/source'
      },
      {
        test: /\.(jpg|jpeg|png|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[hash][ext][query]'
        }
      },
      {
        test: /\.ico$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/icons/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2?|eot|ttf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      }
    ]
  },
  stats: 'errors-warnings',
  performance: {
    // We should eventually consider chunking to decrease
    // these values
    maxEntrypointSize: 27000000,
    maxAssetSize: 27000000
  }
};

export default config;
