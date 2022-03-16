const config = require('./webpack.dev');

const path = require('path');

config.devtool = false;

const vueLoaderRule = config.module.rules.find(r => r.use === 'vue-loader');

vueLoaderRule.use = {
    loader: 'vue-loader',
    // Attempt to use Babel with babel-plugin-istanbul
    options: {
        compiler: require('vue-template-babel-compiler'),
        compilerOptions: {
            babelOptions: require('./babel.coverage')
        }
    }
};

config.module.rules.push({
    test: /\.js$/,
    // test: /(\.js$)|(\?vue&type=template)/,
    // exclude: /node_modules(?!.*\.vue)/,
    // exclude: /node_modules|e2e|example|lib|dist|\.*.*Spec\.js/,
    use: {
        loader: 'babel-loader',
        options: {
            configFile: path.resolve(process.cwd(), 'babel.coverage.js')
        }
    }
});

module.exports = config;
