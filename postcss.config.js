const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    './src/**/*.html',
    './src/**/*.vue',
    './src/**/*.js'
  ],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
});

module.exports = {
  plugins: [
    ...(process.env.NODE_ENV === 'production' ? [purgecss] : [])
  ]
};