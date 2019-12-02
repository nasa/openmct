const path = require('path');
const bourbon = require('node-bourbon');
const packageDefinition = require('./package.json');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const devMode = process.env.NODE_ENV !== 'production';
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// TODO: Build Constants w/ git-rev-sync
const gitRevision = require('child_process')
    .execSync('git rev-parse HEAD')
    .toString().trim();
const gitBranch = require('child_process')
    .execSync('git rev-parse --abbrev-ref HEAD')
    .toString().trim();

const webpackConfig = {
    mode: devMode ? 'development' : 'production',
    entry: {
        openmct: './openmct.js',
    },
    output: {
        filename: '[name].js',
        library: '[name]',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        alias: {
            "legacyRegistry": path.join(__dirname, "src/legacyRegistry"),
            "saveAs": "file-saver",
            "csv": "comma-separated-values",
            "EventEmitter": "eventemitter3",
            "bourbon": "bourbon.scss",
            "vue": path.join(__dirname, "node_modules/vue/dist/vue.js"),
            "d3-scale": path.join(__dirname, "node_modules/d3-scale/build/d3-scale.min.js"),
            "printj": path.join(__dirname, "node_modules/printj/dist/printj.min.js"),
            "styles": path.join(__dirname, "src/styles")
        }
    },
    devtool: devMode ? 'eval-source-map' : 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            __OPENMCT_VERSION__: `'${packageDefinition.version}'`,
            __OPENMCT_BUILD_DATE__: `'${new Date()}'`,
            __OPENMCT_REVISION__: `'${gitRevision}'`,
            __OPENMCT_BUILD_BRANCH__: `'${gitBranch}'`
        }),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            path: 'assets/styles/',
            filename: '[name].css'
        }),
        new CopyWebpackPlugin([
            {
                from: 'src/images/favicons',
                to: 'favicons'
            },
            {
                from: './index.html',
                transform: function (content) {
                    return content.toString().replace(/dist\//g, '');
                }
            }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.(sc|sa|c)ss$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            injectType: 'lazyStyleTag' // change to lazyStyleTag and use styles in themes plugin
                        }
                    },
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            prependData: `
                                @import "styles/core.scss";
                            `
                        }
                    }
                ]
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            },
            {
                test: /zepto/,
                use: [
                    "imports-loader?this=>window",
                    "exports-loader?Zepto"
                ]
            },
            {
                test: /\.(jpg|jpeg|png|svg|ico|woff2?|eot|ttf)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath(url, resourcePath, context) {
                        if (/\.(jpg|jpeg|png|svg)$/.test(url)) {
                            return `images/${url}`
                        }
                        if (/\.ico$/.test(url)) {
                            return `icons/${url}`
                        }
                        if (/\.(woff2?|eot|ttf)$/.test(url)) {
                            return `fonts/${url}`
                        } else {
                            return `${url}`;
                        }
                    }
                }
            },
            {
                test: /\.vue$/,
                use: 'vue-loader'
            }
        ]
    },
    stats: {
        modules: false,
        timings: true,
        colors: true,
        warningsFilter: /asset size limit/g
    }
};

module.exports = webpackConfig;
