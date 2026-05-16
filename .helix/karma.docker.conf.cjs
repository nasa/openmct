const path = require('path');

const baseConfig = require('../karma.conf.cjs');
const repoRoot = path.resolve(__dirname, '..');

module.exports = async function (config) {
  await baseConfig(config);
  config.set({
    basePath: repoRoot,
    customLaunchers: {
      ChromeHeadlessDocker: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      }
    },
    browsers: ['ChromeHeadlessDocker']
  });
};
