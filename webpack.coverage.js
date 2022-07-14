// This file extends the webpack.dev.js config to add istanbul coverage
// instrumentation using babel-plugin-istanbul (see babel.coverage.js)

const config = require('./webpack.dev');
const path = require('path');
const vueLoaderRule = config.module.rules.find(r => r.use === 'vue-loader');
// eslint-disable-next-line no-undef
const CI = process.env.CI === 'true';

config.devtool = CI ? false : undefined;

vueLoaderRule.use = {
    loader: 'vue-loader'
    // Attempt to use Babel with babel-plugin-istanbul

    // TODO The purpose of this was to try to add coverage to JS expressions
    // inside `<template>` markup, but it seems to add only coverage inside
    // `<script>` tags.
    // Issue: https://github.com/nasa/openmct/issues/4973
    //
    // options: {
    //     compiler: require('vue-template-babel-compiler'),
    //     compilerOptions: {
    //         babelOptions: require('./babel.coverage')
    //     }
    // }
};

config.module.rules.push({
    test: /\.js$/,
    // test: /(\.js$)|(\?vue&type=template)/,
    // exclude: /node_modules(?!.*\.vue)/,
    exclude: /(Spec\.js$)|(node_modules)/,
    use: {
        loader: 'babel-loader',
        options: {
            // eslint-disable-next-line no-undef
            configFile: path.resolve(process.cwd(), 'babel.coverage.js')
        }
    }
});

module.exports = config;
