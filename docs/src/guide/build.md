# Build Guide

Open MCT is built using [`npm`](http://npmjs.com/) and [`webpack`](https://webpack.js.org/).

## Building from source

`npm run install`

The output of the build process is placed in a `dist` folder under the openmct source 
directory, which can be copied out to another location as needed. The contents 
of this folder will include a minified javascript file named `openmct.js` as 
well as assets such as html, css, and images necessary for the UI.

## Build Time

From our package.json:

`"build:prod"` Run by default on a `npm install` statement.
`"build:dev"` 
`"build:coverage"`
`"build:watch"`

`NODE_ENV`

## Run Time

`NODE_ENV`

From our package.json:

```json
    "test": "cross-env NODE_ENV=test NODE_OPTIONS=\"--max_old_space_size=4096\" karma start --single-run",
    "test:debug": "cross-env NODE_ENV=debug karma start --no-single-run",
    "test:watch": "cross-env NODE_ENV=test NODE_OPTIONS=\"--max_old_space_size=4096\" karma start --no-single-run",
```

From our circleci.yaml:

```yaml
version: 2.1
executors:
  pw-focal-development:
    docker:
      - image: mcr.microsoft.com/playwright:v1.25.2-focal
    environment:
      NODE_ENV: development # Needed to ensure 'dist' folder created and devDependencies installed
```

From our karma.conf

```js
module.exports = (config) => {
    const webpackConfig = require('./webpack.coverage.js');
    delete webpackConfig.output;

    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'indexTest.js',
            {
                pattern: 'dist/couchDBChangesFeed.js*',
                included: false
            },
            {
                pattern: 'dist/inMemorySearchWorker.js*',
                included: false
            },
            {
                pattern: 'dist/generatorWorker.js*',
                included: false
            }
        ],
        port: 9876,
        reporters: ['spec', 'junit', 'coverage-istanbul'],
        browsers: [process.env.NODE_ENV === 'debug' ? 'ChromeDebugging' : 'ChromeHeadless'],
        client: {
            jasmine: {
                random: false,
                timeoutInterval: 5000
            }
        },
```
