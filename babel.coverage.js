// This is a Babel config that webpack.coverage.js uses in order to instrument
// code with coverage instrumentation.
const babelConfig = {
    plugins: [['babel-plugin-istanbul', {
        extension: ['.js', '.vue']
    }]]
};

module.exports = babelConfig;
