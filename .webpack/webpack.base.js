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

function setImportPath(p) {
  const projectRootDir = path.resolve(__dirname, '..');
  return path.resolve(projectRootDir, p);
}

let plugins = [
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
  })
];

// Important! This loader needs to always be first in (test: /css/scss/less)
function setCSSLoader(env) {
  if (env === 'production') {
    return {
      loader: MiniCssExtractPlugin.loader
    };
  }
  return {
    loader: 'style-loader'
  };
}

function setPostCssLoader(env) {
  if (env === 'production') {
    return {
      loader: 'postcss-loader',
      options: {
        sourceMap: true
      }
    };
  }
  return '';
}
/** @type {import('webpack').Configuration} */
const config = function (env) {
  if (env === 'production') {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css',
        chunkFilename: 'chunks/[id].[contenthash].css'
      })
    );
  }
  return {
    context: path.resolve(__dirname, '..'),
    entry: {
      openmct: setImportPath('openmct.js'),
      generatorWorker: setImportPath('example/generator/generatorWorker.js'),
      couchDBChangesFeed: setImportPath('src/plugins/persistence/couch/CouchChangesFeed.js'),
      inMemorySearchWorker: setImportPath('src/api/objects/InMemorySearchWorker.js'),
      espressoTheme: setImportPath('src/plugins/themes/espresso-theme.scss'),
      snowTheme: setImportPath('src/plugins/themes/snow-theme.scss')
    },
    output: {
      globalObject: 'this',
      filename: 'js/[name].bundle.[fullhash].js',
      chunkFilename: 'chunks/[name].chunk.[fullhash].js',
      path: setImportPath('dist'),
      library: 'openmct',
      libraryTarget: 'umd',
      publicPath: 'auto',
      hashFunction: 'xxhash64',
      clean: true
    },
    resolve: {
      alias: {
        '@': setImportPath('src'),
        legacyRegistry: setImportPath('src/legacyRegistry'),
        saveAs: 'file-saver/src/FileSaver.js',
        csv: 'comma-separated-values',
        EventEmitter: 'eventemitter3',
        bourbon: 'bourbon.scss',
        'plotly-basic': 'plotly.js-basic-dist',
        'plotly-gl2d': 'plotly.js-gl2d-dist',
        'd3-scale': setImportPath('node_modules/d3-scale/dist/d3-scale.min.js'),
        printj: setImportPath('node_modules/printj/dist/printj.min.js'),
        styles: setImportPath('src/styles'),
        MCT: setImportPath('src/MCT'),
        testUtils: setImportPath('src/utils/testUtils.js'),
        objectUtils: setImportPath('src/api/objects/object-utils.js'),
        utils: setImportPath('src/utils'),
        vue: setImportPath('node_modules/@vue/compat/dist/vue.esm-bundler.js')
      },
      extensions: ['.ts', '.css', '.scss', '.js', '.vue']
    },
    plugins,
    module: {
      rules: [
        {
          test: /\.(sc|sa|c)ss$/,
          use: [
            setCSSLoader(env),
            {
              loader: 'css-loader',
              options: {
                sourceMap: env !== 'production'
              }
            },
            {
              loader: 'resolve-url-loader'
            },
            setPostCssLoader(env),
            {
              loader: 'sass-loader',
              // resolve-url-loader needs all loaders below its decl to have sourcemaps enabled
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
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
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
};

module.exports = config;
