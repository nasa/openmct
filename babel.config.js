const babelConfig = {
    plugins: [['babel-plugin-istanbul', {
        extension: ['.js', '.vue']
    }]]
};

module.exports = babelConfig;
