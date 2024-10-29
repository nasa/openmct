# Testing

Open MCT Testing is iterating and improving at a rapid pace. This document serves to capture and index existing testing documentation and house documentation which no other obvious location as our testing evolves.

## General Testing Process

Documentation located [here](./docs/src/process/testing/plan.md)

## Unit Testing

Unit testing is essential part of our test strategy and complements our e2e testing strategy.

### Unit Test Guidelines

* Unit Test specs should reside alongside the source code they test, not in a separate directory.
* Unit test specs for plugins should be defined at the plugin level. Start with one test spec per plugin named pluginSpec.js, and as this test spec grows too big, break it up into multiple test specs that logically group related tests.
* Unit tests for API or for utility functions and classes may be defined at a per-source file level.
* Wherever possible only use and mock public API, builtin functions, and UI in your test specs. Do not directly invoke any private functions. ie. only call or mock functions and objects exposed by openmct.* (eg. openmct.telemetry, openmct.objectView, etc.), and builtin browser functions (fetch, requestAnimationFrame, setTimeout, etc.).
* Where builtin functions have been mocked, be sure to clear them between tests.
* Test at an appropriate level of isolation. Eg.
  * If you’re testing a view, you do not need to test the whole application UI, you can just fetch the view provider using the public API and render the view into an element that you have created.
  * You do not need to test that the view switcher works, there should be separate tests for that.
  * You do not need to test that telemetry providers work, you can mock openmct.telemetry.request() to feed test data to the view.
  * Use your best judgement when deciding on appropriate scope.
* Automated tests for plugins should start by actually installing the plugin being tested, and then test that installing the plugin adds the desired features and behavior to Open MCT, observing the above rules.
* All variables used in a test spec, including any instances of the Open MCT API should be declared inside of an appropriate block scope (not at the root level of the source file), and should be initialized in the relevant beforeEach block. `beforeEach` is preferable to `beforeAll` to avoid leaking of state between tests.
* A `afterEach` or `afterAll` should be used to do any clean up necessary to prevent leakage of state between test specs. This can happen when functions on `window` are wrapped, or when the URL is changed. [A convenience function](https://github.com/nasa/openmct/blob/master/src/utils/testing.js#L59) is provided for resetting the URL and clearing builtin spies between tests.

### Unit Test Examples

* [Example of an automated test spec for an object view plugin](https://github.com/nasa/openmct/blob/master/src/plugins/telemetryTable/pluginSpec.js)
* [Example of an automated test spec for API](https://github.com/nasa/openmct/blob/master/src/api/time/TimeAPISpec.js)

### Unit Testing Execution

The unit tests can be executed in one of two ways:
`npm run test` which runs the entire suite against headless chrome
`npm run test:debug` for debugging the tests in realtime in an active chrome session.

## e2e, performance, and visual testing

### Running Your First Test

```bash
npm install            # install dependencies
npx playwright install # install browser binaries
npm run test:e2e:watch # launch Playwright's UI test-runner
```

### Understanding Open MCT's Test Environment

To effectively write tests, you should understand how a typical Open MCT workspace is structured:

1. Start Open MCT locally: `npm run start`
2. Create a basic workspace:
   * Create a Display Layout object
   * Add a Plot (e.g., Stacked Plot)
   * Add an Example Telemetry object (e.g., Sine Wave Generator)
   * Observe the object hierarchy in the tree
   * Configure the Display Layout with the Plot and Telemetry

This represents a typical mission control display that your tests will interact with.

### Recording Your First Test

Use [Playwright's codegen tool](https://playwright.dev/docs/codegen) to record test interactions:

1. Start Open MCT: `npm run start`
2. Launch Playwright codegen: `npx playwright codegen`
3. Navigate to `http://localhost:8080` (or the location of your local Open MCT instance)
4. Create objects and observe the generated test code
5. Save and modify the recorded test as needed

## Test Types

| Type | Purpose | When to Use | Example |
|------|---------|-------------|---------|
| Functional | Verify application behavior | Testing user workflows and features | Creating and editing objects |
| Visual | Check UI appearance | Detecting unwanted visual changes | Theme consistency, layout verification |
| Accessibility | Verify a11y compliance | Testing WCAG/Section 508 compliance | Color contrast, ARIA labels |
| Performance | Check app performance | Testing load times and memory usage | Page load times, memory leaks |

### Functional Testing

The primary method for testing Open MCT's behavior. These tests:

* Verify application functionality through UI interactions
* Define expected behavior patterns
* Run across multiple browsers and environments

Example functional test:

```js
test('can create and edit a Display Layout', async ({ page }) => {
    // Create a new Display Layout
    const layout = await createDomainObjectWithDefaults(page, { type: 'Display Layout' });
    
    // Verify creation
    expect(page.getByRole('heading', { name: layout.name })).toBeVisible();
    
    // Edit the layout
    await page.getByRole('button', { name: 'Edit' }).click();
    
    // Verify edit mode
    expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
});
```

### Visual Testing

Visual testing ensures UI consistency using Percy.io for comparisons. Tests run with:

```bash
npm run test:e2e:visual      # Local testing
npm run test:e2e:visual:ci   # CI testing
npm run test:e2e:visual:full # Extended testing (nightly)
```

#### Percy.io Integration

* Maintains baseline comparisons
* Tracks changes across commits
* Requires developer approval for visual changes
* Configuration files:
  * `.percy.ci.yml`: Standard CI checks
  * `.percy.nightly.yml`: Extended nightly checks

#### Writing Great Visual Tests

1. **Focus on Unknown Changes**

```javascript
test('menu appearance remains consistent', async ({ page }) => {
    // Get into interesting state
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Capture entire menu state
    await percySnapshot(page, 'Create Menu Expanded');
});
```

2. **Control Time-Based Elements**

```javascript
test('clock display @clock', async ({ page }) => {
    await page.clock.install({ time: FIXED_TIME });
    await page.goto('./#/browse/mine?hideTree=true');
    await percySnapshot(page, 'Clock Display Fixed Time');
});
```

3. **Component-Specific Testing**

```javascript
test('tree component', async ({ page }) => {
    const treePane = page.locator('.c-tree');
    await percySnapshot(page, 'Tree Component', {
        scope: treePane
    });
});
```

### Accessibility (a11y) Testing

Open MCT implements accessibility testing through:

1. **Accessible Locators**

```javascript
// Preferred
page.getByRole('button', { name: 'Create' });

// Avoid
page.locator('.create-button');
```

2. **Automated Checks**

```javascript
test('meets accessibility standards @a11y', async ({ page }) => {
    await page.goto('./');
    await scanForA11yViolations(page);
});
```

#### a11y Standards Support

* Section 508 compliance
* WCAG 2.0 AA standards
* Automated contrast checking

#### Reading a11y Reports

Reports are generated in `/test-results/` with this structure:

```json
{
  "violations": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "target": [".element-selector"],
      "failureSummary": "Contrast ratio 3:1 does not meet 4.5:1 requirement"
    }
  ]
}
```

### Performance Testing

Performance tests are organized in three categories:

1. **Basic Performance** (`tests/performance/`)

```javascript
test('loads large displays quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(LARGE_DISPLAY_URL);
    expect(Date.now() - startTime).toBeLessThan(3000);
});
```

2. **Contract Tests** (`tests/performance/contract/`)

```javascript
test('maintains API response times', async ({ page }) => {
    const [response] = await Promise.all([
        page.waitForResponse('**/api/objects/**'),
        page.reload()
    ]);
    expect(response.timing().responseEnd).toBeLessThan(200);
});
```

3. **Memory Tests** (`tests/performance/memory/`)

```javascript
test('no memory leaks in telemetry view', async ({ page }) => {
    await page.coverage.startJSCoverage();
    // ... test actions ...
    const coverage = await page.coverage.stopJSCoverage();
    expect(coverage.memory).toBeLessThan(MEMORY_THRESHOLD);
});
```

### Configuration Files

| File | Purpose |
|------|---------|
| `playwright-ci.config.js` | CI environment settings |
| `playwright-local.config.js` | Local development settings |
| `playwright-performance.config.js` | Performance test settings |
| `playwright-visual-a11y.config.js` | Visual/a11y test settings |

### Test Tags

| Tag | Purpose | Example Use |
|-----|---------|------------|
| `@mobile` | Mobile-compatible tests | `test('mobile view @mobile')` |
| `@a11y` | Accessibility checks | `test('contrast check @a11y')` |
| `@addInit` | Custom initialization | `test('plugin test @addInit')` |
| `@localStorage` | Storage state tests | `test('persist state @localStorage')` |
| `@2p` | Multi-user/tab tests | `test('collaboration @2p')` |
| `@clock` | Time-manipulation tests | `test('timer display @clock')` |

### Test Architecture

## Test Architecture and Organization

### File Structure

```txt
@openmct/e2e/
├── helper/                 # Test helper functions
├── test-data/              # Test data
├── tests/
│   ├── functional/         # Main functional tests
│   │   ├── example/        # Example plugin tests
│   │   └── plugins/        # Plugin-specific tests
│   ├── framework/          # Framework capability tests
│   ├── performance/        # Performance test suites
│   │   ├── contract/       # API contract tests
│   │   └── memory/         # Memory leak tests
│   └── visual-a11y/        # Visual and a11y tests
├── appActions.js           # Common test actions
└── baseFixture.js          # Base test fixtures
```

### Best Practices

#### Writing Effective Tests

1. **Use App Actions**

```javascript
// Good
const layout = await createDomainObjectWithDefaults(page, { 
    type: 'Display Layout' 
});

// Avoid
await page.click('.create-button');
await page.fill('.name-input', 'New Layout');
```

2. **Navigate Directly Whenever Possible**

```javascript
// Good
await page.goto(layout.url);

// Avoid
await page.click('.navigation-tree');
await page.click(`text=${layout.name}`);
```

3. **Control Time-Based Elements**

```javascript
test('clock display @clock', async ({ page }) => {
    await page.clock.install({ time: FIXED_TIME });
    // ... test steps ...
});
```

#### Working with LocalStorage

1. **Generate Test State**

```javascript
test('save complex display @localStorage', async ({ context }) => {
    // Create test state
    await setupComplexDisplay(page);
    
    // Save for future tests
    await context.storageState({
        path: fileURLToPath(new URL('./test-data/complex-display.json', import.meta.url))
    });
});
```

2. **Load Saved State**

```javascript
test.use({ 
    storageState: fileURLToPath(new URL('./test-data/complex-display.json', import.meta.url))
});
```

### Continuous Integration

#### Test Execution Stages

1. **Per-Commit (CircleCI)**

* Basic e2e suite
* Performance checks
* Visual/a11y baseline

```bash
npm run test:e2e:ci
```

2. **Per-Merge (GitHub Actions)**

* Full browser matrix
* CouchDB integration

```bash
npm run test:e2e:full
```

3. **Nightly**

* Extended visual tests
* Full performance suite
* Memory leak detection

```bash
npm run test:e2e:nightly
```

#### Cross-Browser Testing

Supported Browsers:

* Chromium (beta channel)
* Chrome (stable)
* Firefox (stable)
* Mobile Safari (iPad)

Example configuration:

#### Example Configuration

```javascript
// playwright-ci.config.js
const baseConfig = {
    timeout: 60000,
    workers: 1,
    retries: 1,
    reporter: [
        ['html'],
        ['junit', { outputFile: 'test-results/results.xml' }]
    ]
};

const browserConfig = {
    chromium: {
        use: {
            browserName: 'chromium',
            channel: 'chrome',
            viewport: { width: 1280, height: 720 },
            screenshot: 'only-on-failure',
            trace: 'retain-on-failure'
        }
    },
    firefox: {
        use: {
            browserName: 'firefox',
            viewport: { width: 1280, height: 720 }
        }
    },
    webkit: {
        use: {
            browserName: 'webkit',
            // iPad Pro 11 dimensions
            viewport: { width: 834, height: 1194 },
            deviceScaleFactor: 2
        }
    }
};

// Mobile Configuration
const mobileConfig = {
    use: {
        ...browserConfig.webkit.use,
        isMobile: true,
        hasTouch: true
    }
};

// OS-specific configurations
const osConfig = {
    darwin: {
        // MacOS specific settings
    },
    win32: {
        // Windows specific settings
    },
    linux: {
        // Linux specific settings
    }
};

module.exports = {
    ...baseConfig,
    projects: [
        {
            name: 'chrome',
            ...browserConfig.chromium
        },
        {
            name: 'firefox',
            ...browserConfig.firefox
        },
        {
            name: 'mobile-safari',
            ...mobileConfig
        }
    ]
};
```

#### Conditional Test Execution

1. **Browser-specific Tests**

```javascript
test('drag and drop @mobile', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Feature not supported in Firefox');
    // ... test steps ...
});
```

2. **OS-specific Tests**

```javascript
test('file system integration', async ({ page }) => {
    test.skip(process.platform === 'darwin', 'Different behavior on MacOS');
    // ... test steps ...
});
```

3. **Mobile-specific Tests**

```javascript
test('touch interactions @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Touch-only test');
    // ... test steps ...
});
```

#### Browser Version Detection

```javascript
test('modern API feature', async ({ browser }) => {
    const version = await browser.version();
    test.skip(
        parseInt(version) < 90,
        'Feature requires Chrome 90+'
    );
    // ... test steps ...
});
```

## Advanced Topics and Troubleshooting

### Working with Multiple Pages

For multi-page tests (`@2p` tag):

```javascript
test('collaborative editing @2p', async ({ browser }) => {
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    // User 1 creates object
    const layout = await createDomainObjectWithDefaults(page1, { 
        type: 'Display Layout' 
    });
    
    // User 2 views and edits
    await page2.goto(layout.url);
    await page2.getByRole('button', { name: 'Edit' }).click();
});
```

### Handling File Downloads

```javascript
test('export object as JSON', async ({ page }) => {
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByLabel('Export as JSON').click()
    ]);
    
    const path = await download.path();
    const contents = await fs.readFile(path, 'utf8');
    const jsonData = JSON.parse(contents);
    
    expect(jsonData).toHaveProperty('name', 'Test Object');
});
```

### Code Coverage

1. **Generate Coverage Report**

```bash
npm run test:e2e:coverage
```

2. **Combine with Unit Test Coverage**

```bash
npm run coverage:combine
```

Coverage reports are available in `/coverage/index.html`

### Troubleshooting Guide

#### Common Issues

1. **Port Already in Use**

```bash
# Clear port 8080
lsof -n -i4TCP:8080 | awk '{print$2}' | tail -1 | xargs kill -9
```

2. **Visual Test Failures**

* Check Percy.io dashboard for visual differences
* Review `.percy.yml` configuration
* Verify time-based elements are controlled

3. **Flaky Tests**

* Use `waitForLoadState` instead of arbitrary delays
* Ensure unique test data
* Check for race conditions

#### Debugging Tests

1. **Watch Mode**

```bash
npm run test:e2e:watch
```

2. **Debug Mode**

```bash
npm run test:e2e:debug
```

3. **VSCode Integration**

* Install Playwright VSCode extension
* Use breakpoints and step-through debugging
* Access test reports directly in IDE

### Upgrading Playwright

1. **Update Versions**

* `package.json`

  ```json
  {
    "@playwright/test": "X.Y.Z",
    "playwright-core": "X.Y.Z"
  }
  ```

* CI configuration files
  * `.circleci/config.yml`
  * `.github/workflows/*.yml`

2. **Verify Compatibility**

```bash
npm install
npx playwright install
npm run test:e2e:local
```

### Additional Resources

* [Playwright Documentation](https://playwright.dev/docs/intro)
* [Percy.io Documentation](https://docs.percy.io)
* [Open MCT Testing Guide](../README.md#tests)
* [Example Test Template](./tests/framework/exampleTemplate.e2e.spec.js)

## Contributing

1. Review the [Example Template](./tests/framework/exampleTemplate.e2e.spec.js)
2. Follow the best practices outlined in this document
3. Ensure tests are:
   * Properly tagged
   * Include clear descriptions
   * Follow accessibility guidelines
   * Use appropriate assertions

## Code Coverage

It's up to the individual developer as to whether they want to add line coverage in the form of a unit test or e2e test.

Line Code Coverage is generated by our unit tests and e2e tests, then combined by ([Codecov.io Flags](https://docs.codecov.com/docs/flags)), and finally reported in GitHub PRs by Codecov.io's PR Bot. This workflow gives a comprehensive (if flawed) view of line coverage.

### Karma-istanbul

Line coverage is generated by our `karma-coverage-istanbul-reporter` package as defined in our `karma.conf.js` file:

```js
    coverageIstanbulReporter: {
      fixWebpackSourcePaths: true,
      skipFilesWithNoCoverage: true,
      dir: 'coverage/unit', //Sets coverage file to be consumed by codecov.io
      reports: ['lcovonly']
    },
```

Once the file is generated, it can be published to codecov with

```json
    "cov:unit:publish": "codecov --disable=gcov -f ./coverage/unit/lcov.info -F unit",
```

### e2e

The e2e line coverage is a bit more complex than the karma implementation. This is the general sequence of events:

1. Each e2e suite will start webpack with the ```npm run start:coverage``` command with config `webpack.coverage.mjs` and the `babel-plugin-istanbul` plugin to generate code coverage during e2e test execution using our custom [baseFixture](./baseFixtures.js).
1. During testcase execution, each e2e shard will generate its piece of the larger coverage suite. **This coverage file is not merged**. The raw coverage file is stored in a `.nyc_report` directory.
1. [nyc](https://github.com/istanbuljs/nyc) converts this directory into a `lcov` file with the following command `npm run cov:e2e:report`
1. Most of the tests focus on chrome/ubuntu at a single resolution. This coverage is published to codecov with `npm run cov:e2e:ci:publish`.
1. The rest of our coverage only appears when run against persistent datastore (couchdb), non-ubuntu machines, and non-chrome browsers with the `npm run cov:e2e:full:publish` flag. Since this happens about once a day, we have leveraged codecov.io's carryforward flag to report on lines covered outside of each commit on an individual PR.

### Limitations in our code coverage reporting

Our code coverage implementation has some known limitations:

* [Variability](https://github.com/nasa/openmct/issues/5811)
* [Accuracy](https://github.com/nasa/openmct/issues/7015)
* [Vue instrumentation gaps](https://github.com/nasa/openmct/issues/4973)

## Troubleshooting CI

The following is an evolving guide to troubleshoot CI and PR issues.

### Github Checks failing

There are a few reasons that your GitHub PR could be failing beyond simple failed tests.

* Required Checks. We're leveraging required checks in GitHub so that we can quickly and precisely control what becomes and informational failure vs a hard requirement. The only way to determine the difference between a required vs information check is check for the `(Required)` emblem next to the step details in GitHub Checks.
* Not all required checks are run per commit. You may need to manually trigger addition GitHub checks with a `pr:<label>` label added to your PR.

### Flaky tests

[CircleCI's test insights feature](https://circleci.com/blog/introducing-test-insights-with-flaky-test-detection/) collects historical data about the individual test results for both unit and e2e tests. Note: only a 14 day window of flake is available.

### Local=Pass and CI=Fail

Although rare, it is possible that your test can pass locally but fail in CI.

### Reset your workspace

It's possible that you're running with dependencies or a local environment which is out of sync with the branch you're working on. Make sure to execute the following:

```sh
nvm use
npm run clean
npm install
```

#### Run tests in the same container as CI

In extreme cases, tests can fail due to the constraints of running within a container. To execute tests in exactly the same way as run in CircleCI.

```sh
// Replace {X.X.X} with the current Playwright version 
// from our package.json or circleCI configuration file
docker run --rm --network host --cpus="2" -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v{X.X.X}-focal /bin/bash
npm install
```

At this point, you're running inside the same container and with 2 cpu cores. You can specify the unit tests:

```sh
npm run test
```

or e2e tests:

```sh
npx playwright test --config=e2e/playwright-ci.config.js --project=chrome --grep <the testcase name>
```
