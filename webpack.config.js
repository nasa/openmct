const path = require('path');
const bourbon = require('node-bourbon');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// TODO: Build Constants w/ git-rev-sync

const webpackConfig = {
    mode: devMode ? 'development' : 'production',
    entry: {
        openmct: './openmct.js',
    },
    output: {
        filename: '[name].js',
        library: '[name]',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        alias: {
            "legacyRegistry": path.join(__dirname, "src/legacyRegistry"),
            "saveAs": "file-saver",
            "csv": "comma-separated-values",
            "EventEmitter": "eventemitter3",
            "bourbon": "bourbon.scss",
            "espresso": path.join(__dirname, "src/styles/theme-espresso.scss"),
            "snow": path.join(__dirname, "src/styles/theme-snow.scss"),
            "vue": path.join(__dirname, "node_modules/vue/dist/vue.min.js"),
            "d3-scale": path.join(__dirname, "node_modules/d3-scale/build/d3-scale.min.js")
        }
    },
    devtool: devMode ? 'eval-source-map' : 'source-map',
    plugins: [
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
                    devMode ? 'style-loader': MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'fast-sass-loader',
                        options: {
                            includePaths: bourbon.includePaths
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
                    useRelativePath: true,
                    outputPath: 'assets/'
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
