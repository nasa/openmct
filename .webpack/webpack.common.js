/* global __dirname module */

/*
This is the OpenMCT common webpack file. It is imported by the other three webpack configurations:
 - webpack.prod.js - the production configuration for OpenMCT (default)
 - webpack.dev.js - the development configuration for OpenMCT
 - webpack.coverage.js - imports webpack.dev.js and adds code coverage
There are separate npm scripts to use these configurations, though simply running `npm install`
will use the default production configuration.
*/
const path = require('path');
const packageDefinition = require('../package.json');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { VueLoaderPlugin } = require('vue-loader');
let gitRevision = 'error-retrieving-revision';
let gitBranch = 'error-retrieving-branch';

try {
  gitRevision = require('child_process').execSync('git rev-parse HEAD').toString().trim();
  gitBranch = require('child_process')
    .execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();
} catch (err) {
  console.warn(err);
}

const projectRootDir = path.resolve(__dirname, '..');

/** @type {import('webpack').Configuration} */
const config = {
  context: projectRootDir,
  entry: {
    openmct: './openmct.js',
    generatorWorker: './example/generator/generatorWorker.js',
    couchDBChangesFeed: './src/plugins/persistence/couch/CouchChangesFeed.js',
    inMemorySearchWorker: './src/api/objects/InMemorySearchWorker.js',
    espressoTheme: './src/plugins/themes/espresso-theme.scss',
    snowTheme: './src/plugins/themes/snow-theme.scss'
  },
  output: {
    globalObject: 'this',
    filename: '[name].js',
    path: path.resolve(projectRootDir, 'dist'),
    library: 'openmct',
    libraryTarget: 'umd',
    publicPath: '',
    hashFunction: 'xxhash64',
    clean: true
  },
  resolve: {
    alias: {
      '@': path.join(projectRootDir, 'src'),
      legacyRegistry: path.join(projectRootDir, 'src/legacyRegistry'),
      saveAs: 'file-saver/src/FileSaver.js',
      csv: 'comma-separated-values',
      EventEmitter: 'eventemitter3',
      bourbon: 'bourbon.scss',
      'plotly-basic': 'plotly.js-basic-dist',
      'plotly-gl2d': 'plotly.js-gl2d-dist',
      'd3-scale': path.join(projectRootDir, 'node_modules/d3-scale/dist/d3-scale.min.js'),
      printj: path.join(projectRootDir, 'node_modules/printj/dist/printj.min.js'),
      styles: path.join(projectRootDir, 'src/styles'),
      MCT: path.join(projectRootDir, 'src/MCT'),
      testUtils: path.join(projectRootDir, 'src/utils/testUtils.js'),
      objectUtils: path.join(projectRootDir, 'src/api/objects/object-utils.js'),
      utils: path.join(projectRootDir, 'src/utils'),
      vue: path.join(projectRootDir, 'node_modules/@vue/compat/dist/vue.esm-bundler.js'),
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      __OPENMCT_VERSION__: `'${packageDefinition.version}'`,
      __OPENMCT_BUILD_DATE__: `'${new Date()}'`,
      __OPENMCT_REVISION__: `'${gitRevision}'`,
      __OPENMCT_BUILD_BRANCH__: `'${gitBranch}'`
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
            whitespace: 'preserve',
            compatConfig: {
              MODE: 2
            }
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
          filename: 'images/[name][ext]'
        }
      },
      {
        test: /\.ico$/,
        type: 'asset/resource',
        generator: {
          filename: 'icons/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2?|eot|ttf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
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

module.exports = config;
