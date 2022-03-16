const babelConfig = {
    plugins: [['babel-plugin-istanbul', {
        extension: ['.js', '.vue']
        // include: ['./**/*.js', './**/*.vue*'],
        // excludeNodeModules: false
    }]]
};

module.exports = babelConfig;
