# e2e testing

This document captures information specific to the e2e testing of Open MCT. For general information about testing, please see [the Open MCT README](https://github.com/nasa/openmct/blob/master/README.md#tests).

## Table of Contents

This document is designed to capture on the What, Why, and How's of writing and running e2e tests in Open MCT. Please use the built-in Github Table of Contents functionality at the top left of this page or the markup.

1. [Getting Started](#getting-started)
2. [Types of Testing](#types-of-e2e-testing)
3. [Architecture](#test-architecture-and-ci)

## Getting Started

While our team does our best to lower the barrier to entry to working with our e2e framework and Open MCT, there is a bit of work required to get from 0 to 1 test contributed.

### Getting started with Playwright

If this is your first time ever using the Playwright framework, we recommend going through the [Getting Started Guide](https://playwright.dev/docs/next/intro) which can be completed in about 15 minutes. This will give you a concise tour of Playwright's functionality and an understanding of the official Playwright documentation which we leverage in Open MCT.

### Getting started with Open MCT's implementation of Playwright

Once you've got an understanding of Playwright, you'll need a baseline understanding of Open MCT:

1. Follow the steps [Building and Running Open MCT Locally](../README.md#building-and-running-open-mct-locally)
2. Once you're serving Open MCT locally, create a 'Display Layout' object. Save it.
3. Create a 'Plot' Object (e.g.: 'Stacked Plot')
4. Create an Example Telemetry Object (e.g.: 'Sine Wave Generator')
5. Expand the Tree and note the hierarchy of objects which were created.
6. Navigate to the Demo Display Layout Object to edit and modify the embedded plot.
7. Modify the embedded plot with Telemetry Data.

What you've created is a display which mimics the display that a mission control operator might use to understand and model telemetry data.

Recreate the steps above with Playwright's codegen tool:

1. `npm run start` in a terminal window to serve Open MCT locally
2. `npx @playwright/test install` to install playwright and dependencies
3. Open another terminal window and start the Playwright codegen application `npx playwright codegen`
4. Navigate the browser to `http://localhost:8080`
5. Click the Create button and notice how your actions in the browser are being recorded in the Playwright Inspector
6. Continue through the steps 2-6 above

What you've created is an automated test which mimics the creation of a mission control display.

Next, you should walk through our implementation of Playwright in Open MCT:

1. Close any terminals which are serving up a local instance of Open MCT
2. Run our 'Getting Started' test in debug mode with `npm run test:e2e:local -- exampleTemplate --debug`
3. Step through each test step in the Playwright Inspector to see how we leverage Playwright's capabilities to test Open MCT

## Types of e2e Testing

e2e testing describes the layer at which a test is performed without prescribing the assertions which are made. Generally, when writing an e2e test, we have three choices to make on an assertion strategy:

1. Functional - Verifies the functional correctness of the application. Sometimes interchanged with e2e or regression testing.
2. Visual - Verifies the "look and feel" of the application and can only detect _undesirable changes when compared to a previous baseline_.
3. Snapshot - Similar to Visual in that it captures the "look" of the application and can only detect _undesirable changes when compared to a previous baseline_. **Generally not preferred due to advanced setup necessary.**

When choosing between the different testing strategies, think only about the assertion that is made at the end of the series of test steps. "I want to verify that the Timer plugin functions correctly" vs "I want to verify that the Timer plugin does not look different than originally designed".

We do not want to interleave visual and functional testing inside the same suite because visual test verification of correctness must happen with a 3rd party service. This service is not available when executing these tests in other contexts (i.e. VIPER).

### Functional Testing

The bulk of our e2e coverage lies in "functional" test coverage which verifies that Open MCT is functionally correct as well as defining _how we expect it to behave_. This enables us to test the application exactly as a user would, while prescribing exactly how a user can interact with the application via a web browser.

### Visual Testing

Visual Testing is an essential part of our e2e strategy as it ensures that the application _appears_ correctly to a user while it compliments the functional e2e suite. It would be impractical to make thousands of assertions functional assertions on the look and feel of the application. Visual testing is interested in getting the DOM into a specified state and then comparing that it has not changed against a baseline.

For a better understanding of the visual issues which affect Open MCT, please see our bug tracker with the `label:visual` filter applied [here](https://github.com/nasa/openmct/issues?q=label%3Abug%3Avisual+)
To read about how to write a good visual test, please see [How to write a great Visual Test](#how-to-write-a-great-visual-test).

`npm run test:e2e:visual` commands will run all of the visual tests against a local instance of Open MCT. If no `PERCY_TOKEN` API key is found in the terminal or command line environment variables, no visual comparisons will be made.

 - `npm run test:e2e:visual:ci` will run against every commit and PR.
 - `npm run test:e2e:visual:full` will run every night with additional comparisons made for Larger Displays and with the `snow` theme.
#### Percy.io

To make this possible, we're leveraging a 3rd party service, [Percy](https://percy.io/). This service maintains a copy of all changes, users, scm-metadata, and baselines to verify that the application looks and feels the same _unless approved by a Open MCT developer_. To request a Percy API token, please reach out to the Open MCT Dev team on GitHub. For more information, please see the official [Percy documentation](https://docs.percy.io/docs/visual-testing-basics).

At present, we are using percy with two configuration files: `./e2e/.percy.nightly.yml` and `./e2e/.percy.ci.yml`. This is mainly to reduce the number of snapshots. 

### Advanced: Snapshot Testing (Not Recommended)

While snapshot testing offers a precise way to detect changes in your application without relying on third-party services like Percy.io, we've found that it doesn't offer any advantages over visual testing in our use-cases. Therefore, snapshot testing is **not recommended** for further implementation.

#### CI vs Manual Checks
Snapshot tests can be reliably executed in Continuous Integration (CI) environments but lack the manual oversight provided by visual testing platforms like Percy.io. This means they may miss issues that a human reviewer could catch during manual checks.

#### Example
A single visual test assertion in Percy.io can be executed across 10 different browser and resolution combinations without additional setup, providing comprehensive testing with minimal configuration. In contrast, a snapshot test is restricted to a single OS and browser resolution, requiring more effort to achieve the same level of coverage.


#### Further Reading
For those interested in the mechanics of snapshot testing with Playwright, you can refer to the [Playwright Snapshots Documentation](https://playwright.dev/docs/test-snapshots). However, keep in mind that we do not recommend using this approach.


#### Open MCT's implementation

- Our Snapshot tests receive a `@snapshot` tag.
- Snapshots need to be executed within the official Playwright container to ensure we're using the exact rendering platform in CI and locally. To do a valid comparison locally:

```sh
// Replace {X.X.X} with the current Playwright version 
// from our package.json or circleCI configuration file
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v{X.X.X}-focal /bin/bash
npm install
npx playwright test --config=e2e/playwright-ci.config.js --project=chrome --grep @snapshot
```

### Updating Snapshots

When the `@snapshot` tests fail, they will need to be evaluated to determine if the failure is an acceptable and desireable or an unintended regression.

To compare a snapshot, run a test and open the html report with the 'Expected' vs 'Actual' screenshot. If the actual screenshot is preferred, then the source-controlled 'Expected' snapshots will need to be updated with the following scripts.

MacOS

```
npm run test:e2e:updatesnapshots
```

Linux/CI

```sh
// Replace {X.X.X} with the current Playwright version 
// from our package.json or circleCI configuration file
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v{X.X.X}-focal /bin/bash
npm install
npm run test:e2e:updatesnapshots
```

## Performance Testing

The open source performance tests function mostly as a contract for the locator logic, functionality, and assumptions will work in our downstream, closed source test suites.

They're found under `./e2e/tests/performance` and are to be executed with the following npm script:

`npm run test:perf`

These tests are expected to become blocking and gating with assertions as we extend the capabilities of Playwright.

## Test Architecture and CI

### Architecture

### File Structure

Our file structure follows the type of type of testing being excercised at the e2e layer and files containing test suites which matcher application behavior or our `src` and `example` layout. This area is not well refined as we figure out what works best for closed source and downstream projects. This may change altogether if we move `e2e` to it's own npm package.

|File Path|Description|
|:-:|-|
|`./helper`                    | Contains helper functions or scripts which are leveraged directly within the test suites (e.g.: non-default plugin scripts injected into the DOM)|
|`./test-data`                 | Contains test data which is leveraged or generated in the functional, performance, or visual test suites (e.g.: localStorage data).|
|`./tests/functional`          | The bulk of the tests are contained within this folder to verify the functionality of Open MCT.|
|`./tests/functional/example/` | Tests which specifically verify the example plugins (e.g.: Sine Wave Generator).|
|`./tests/functional/plugins/` | Tests which loosely test each plugin. This folder is the most likely to change. Note: some `@snapshot` tests are still contained within this structure.|
|`./tests/framework/`          | Tests which verify that our testing framework's functionality and assumptions will continue to work based on further refactoring or Playwright version changes (e.g.: verifying custom fixtures and appActions).|
|`./tests/performance/`        | Performance tests.|
|`./tests/visual/`             | Visual tests.|
|`./appActions.js`             | Contains common methods which can be leveraged by test case authors to quickly move through the application when writing new tests.|
|`./baseFixture.js`            | Contains base fixtures which only extend default `@playwright/test` functionality. The expectation is that these fixtures will be removed as the native Playwright API improves|

Our functional tests end in `*.e2e.spec.js`, visual tests in `*.visual.spec.js` and performance tests in `*.perf.spec.js`.

### Configuration

Where possible, we try to run Open MCT without modification or configuration change so that the Open MCT doesn't fail exclusively in "test mode" or in "production mode".

Open MCT is leveraging the [config file](https://playwright.dev/docs/test-configuration) pattern to describe the capabilities of Open MCT e2e _where_ it's run

|Config File|Description|
|:-:|-|
|`./playwright-ci.config.js` | Used when running in CI or to debug CI issues locally|
|`./playwright-local.config.js` | Used when running locally|
|`./playwright-performance.config.js` | Used when running performance tests in CI or locally|
|`./playwright-visual.config.js` | Used to run the visual tests in CI or locally|

#### Test Tags

Test tags are a great way of organizing tests outside of a file structure. To learn more see the official documentation [here](https://playwright.dev/docs/test-annotations#tag-tests).

Current list of test tags:

|Test Tag|Description|
|:-:|-|
|`@ipad` | Test case or test suite is compatible with Playwright's iPad support and Open MCT's read-only mobile view (i.e. no create button).|
|`@gds` | Denotes a GDS Test Case used in the VIPER Mission.|
|`@addInit` | Initializes the browser with an injected and artificial state. Useful for loading non-default plugins. Likely will not work outside of `npm start`.|
|`@localStorage` | Captures or generates session storage to manipulate browser state. Useful for excluding in tests which require a persistent backend (i.e. CouchDB).|
|`@snapshot` | Uses Playwright's snapshot functionality to record a copy of the DOM for direct comparison. Must be run inside of the playwright container.|
|`@unstable` | A new test or test which is known to be flaky.|
|`@2p` | Indicates that multiple users are involved, or multiple tabs/pages are used. Useful for testing multi-user interactivity.|
|`@generatedata` | Indicates that a test is used to generate testdata or test the generated test data. Usually to be associated with localstorage, but this may grow over time.|

### Continuous Integration

The cheapest time to catch a bug is pre-merge. Unfortuantely, this is the most expensive time to run all of the tests since each merge event can consist of hundreds of commits. For this reason, we're selective in _what we run_ as much as _when we run it_.

We leverage CircleCI to run tests against each commit and inject the Test Reports which are generated by Playwright so that they team can keep track of flaky and [historical test trends](https://app.circleci.com/insights/github/nasa/openmct/workflows/overall-circleci-commit-status/tests?branch=master&reporting-window=last-30-days)

We leverage Github Actions / Workflows to execute tests as it gives us the ability to run against multiple operating systems with greater control over git event triggers (i.e. Run on a PR Comment event).

Our CI environment consists of 3 main modes of operation:

#### 1. Per-Commit Testing

CircleCI

- Stable e2e tests against ubuntu and chrome
- Performance tests against ubuntu and chrome
- e2e tests are linted
- Visual tests are run in a single resolution on the default `espresso` theme

#### 2. Per-Merge Testing

Github Actions / Workflow

- Full suite against all browsers/projects. Triggered with Github Label Event 'pr:e2e'
- CouchDB Tests. Triggered on PR Create and again with Github Label Event 'pr:e2e:couchdb'

#### 3. Scheduled / Batch Testing

Nightly Testing in Circle CI

- Full e2e suite against ubuntu and chrome, firefox, and an MMOC resolution profile
- Performance tests against ubuntu and chrome
- CouchDB suite
- Visual Tests are run in the full profile

Github Actions / Workflow

- None at the moment

#### Parallelism and Fast Feedback

In order to provide fast feedback in the Per-Commit context, we try to keep total test feedback at 5 minutes or less. That is to say, A developer should have a pass/fail result in under 5 minutes.

Playwright has native support for semi-intelligent sharding. Read about it [here](https://playwright.dev/docs/test-parallel#shard-tests-between-multiple-machines).

We will be adjusting the parallelization of the Per-Commit tests to keep below the 5 minute total runtime threshold.

In addition to the Parallelization of Test Runners (Sharding), we're also running two concurrent threads on every Shard. This is the functional limit of what CircelCI Agents can support from a memory and CPU resource constraint.

So for every commit, Playwright is effectively running 4 x 2 concurrent browsercontexts to keep the overall runtime to a miminum.

At the same time, we don't want to waste CI resources on parallel runs, so we've configured each shard to fail after 5 test failures. Test failure logs are recorded and stored to allow fast triage.

#### Test Promotion

In order to maintain fast and reliable feedback, tests go through a promotion process. All new test cases or test suites must be labeled with the `@unstable` annotation. The Open MCT dev team runs these unstable tests in our private repos to ensure they work downstream and are reliable.

- To run the stable tests, use the `npm run test:e2e:stable` command.
- To run the new and flaky tests, use the `npm run test:e2e:unstable` command.

A testcase and testsuite are to be unmarked as @unstable when:

1. They run as part of "full" run 5 times without failure.
2. They've been by a Open MCT Developer 5 times in the closed source repo without failure.

### Cross-browser and Cross-operating system

#### **What's supported:**

We are leveraging the `browserslist` project to declare our supported list of browsers. We support macOS, Windows, and ubuntu 20+.

#### **Where it's tested:**

We lint on `browserslist` to ensure that we're not implementing deprecated browser APIs and are aware of browser API improvements over time.

We also have the need to execute our e2e tests across this published list of browsers. Our browsers and browser version matrix is found inside of our `./playwright-*.config.js`, but mostly follows in order of bleeding edge to stable:

- `playwright-chromium channel:beta`
  - A beta version of Chromium from official chromium channels. As close to the bleeding edge as we can get.
- `playwright-chromium`
  - A stable version of Chromium from the official chromium channels. This is always at least 1 version ahead of desktop chrome.
- `playwright-chrome`
  - The stable channel of Chrome from the official chrome channels. This is always 2 versions behind chromium.
- `playwright-firefox`
  - Firefox Latest Stable. Modified slightly by the playwright team to support a CDP Shim.

In terms of operating system testing, we're only limited by what the CI providers are able to support. The bulk of our testing is performed on the official playwright container which is based on ubuntu. Github Actions allows us to use `windows-latest` and `mac-latest` and is run as needed.

#### **Mobile**

We have the Mission-need to support iPad. To run our iPad suite, please see our `playwright-*.config.js` with the 'iPad' project.

In general, our test suite is not designed to run against mobile devices as the mobile experience is a focused version of the application. Core functionality is missing (chiefly the 'Create' button) and so this will likely turn into a separate suite.

#### **Skipping or executing tests based on browser, os, and/os browser version:**

Conditionally skipping tests based on browser (**RECOMMENDED**):

```js
test('Can adjust image brightness/contrast by dragging the sliders', async ({ page, browserName }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(browserName === 'firefox', 'This test needs to be updated to work with firefox');

  // ...
```

Conditionally skipping tests based on OS:

```js
test('Can adjust image brightness/contrast by dragging the sliders', async ({ page }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(process.platform === 'darwin', 'This test needs to be updated to work with MacOS');

  // ...
```

Skipping based on browser version (Rarely used): <https://github.com/microsoft/playwright/discussions/17318>

## Test Design, Best Practices, and Tips & Tricks

### Test Design

#### Test as the User

In general, strive to test only through the UI as a user would. As stated in the [Playwright Best Practices](https://playwright.dev/docs/best-practices#test-user-visible-behavior):

> "Automated tests should verify that the application code works for the end users, and avoid relying on implementation details such as things which users will not typically use, see, or even know about such as the name of a function, whether something is an array, or the CSS class of some element. The end user will see or interact with what is rendered on the page, so your test should typically only see/interact with the same rendered output."

By adhering to this principle, we can create tests that are both robust and reflective of actual user experiences.

#### How to make tests robust to function in other contexts (VISTA, COUCHDB, YAMCS, VIPER, etc.)
  1. Leverage the use of `appActions.js` methods such as `createDomainObjectWithDefaults()`. This ensures that your tests will create unique instances of objects for your test to interact with.
  1. Do not assert on the order or structure of objects available unless you created them yourself. These tests may be used against a persistent datastore like couchdb with many objects in the tree.
  1. Do not search for your created objects. Open MCT does not performance uniqueness checks so it's possible that your tests will break when run twice.
  1. Avoid creating locator aliases. This likely means that you're compensating for a bad locator. Improve the application instead.
  1. Leverage `await page.goto('./', { waitUntil: 'domcontentloaded' });` instead of `{ waitUntil: 'networkidle' }`. Tests run against deployments with websockets often have issues with the networkidle detection.
  
#### How to make tests faster and more resilient
  1. Avoid app interaction when possible. The best way of doing this is to navigate directly by URL:

  ```js
    // You can capture the CreatedObjectInfo returned from this appAction:
    const clock = await createDomainObjectWithDefaults(page, { type: 'Clock' });

    // ...and use its `url` property to navigate directly to it later in the test:
    await page.goto(clock.url);
  ```

  1. Leverage `await page.goto('./', { waitUntil: 'domcontentloaded' });`
    - Initial navigation should _almost_ always use the `{ waitUntil: 'domcontentloaded' }` option.
  1.  Avoid repeated setup to test a single assertion. Write longer tests with multiple soft assertions.
  This ensures that your changes will be picked up with large refactors.

### How to write a great test

- Avoid using css locators to find elements to the page. Use modern web accessible locators like `getByRole`
- Use our [App Actions](./appActions.js) for performing common actions whenever applicable.
  - Use `waitForPlotsToRender()` before asserting against anything that is dependent upon plot series data being loaded and drawn.
- If you create an object outside of using the `createDomainObjectWithDefaults` App Action, make sure to fill in the 'Notes' section of your object with `page.testNotes`:

  ```js
  // Fill the "Notes" section with information about the
  // currently running test and its project.
  const { testNotes } = page;
  const notesInput = page.locator('form[name="mctForm"] #notes-textarea');
  await notesInput.fill(testNotes);
  ```

 #### How to Write a Great Visual Test

1. **Look for the Unknown Unknowns**: Avoid asserting on specific differences in the visual diff. Visual tests are most effective for identifying unknown unknowns.

2. **Get the App into Interesting States**: Prioritize getting Open MCT into unusual layouts or behaviors before capturing a visual snapshot. For instance, you could open a dropdown menu.

3. **Expect the Unexpected**: Use functional expect statements only to verify assumptions about the state between steps. A great visual test doesn't fail during the test itself, but rather when changes are reviewed in Percy.io.

4. **Control Variability**: Account for variations inherent in working with time-based telemetry and clocks.
  - Utilize `percyCSS` to ignore time-based elements. For more details, consult our [percyCSS file](./.percy.ci.yml).
  - Use Open MCT's fixed-time mode.
  - Employ the `createExampleTelemetryObject` appAction to source telemetry and specify a `name` to avoid autogenerated names.

5. **Hide the Tree and Inspector**: Generally, your test will not require comparisons involving the tree and inspector. These aspects are covered in component-specific tests (explained below). To exclude them from the comparison by default, navigate to the root of the main view with the tree and inspector hidden:
    - `await page.goto('./#/browse/mine?hideTree=true&hideInspector=true')`

6. **Component-Specific Tests**: If you wish to focus on a particular component, use the `/visual/component/` folder and limit the scope of the comparison to that component. For instance:
    ```js
    await percySnapshot(page, `Tree Pane w/ single level expanded (theme: ${theme})`, {
        scope: treePane
    });
    ```
    - Note: The `scope` variable can be any valid CSS selector.

#### How to write a great network test

- Where possible, it is best to mock out third-party network activity to ensure we are testing application behavior of Open MCT.
- It is best to be as specific as possible about the expected network request/response structures in creating your mocks.
- Make sure to only mock requests which are relevant to the specific behavior being tested.
- Where possible, network requests and responses should be treated in an order-agnostic manner, as the order in which certain requests/responses happen is dynamic and subject to change.

Some examples of mocking network responses in regards to CouchDB can be found in our [couchdb.e2e.spec.js](./tests/functional/couchdb.e2e.spec.js) test file.

### Best Practices

For now, our best practices exist as self-tested, living documentation in our [exampleTemplate.e2e.spec.js](./tests/framework/exampleTemplate.e2e.spec.js) file.

For best practices with regards to mocking network responses, see our [couchdb.e2e.spec.js](./tests/functional/couchdb.e2e.spec.js) file.

### Tips & Tricks

The following contains a list of tips and tricks which don't exactly fit into a FAQ or Best Practices doc.

- (Advanced) Overriding the Browser's Clock
It is possible to override the browser's clock in order to control time-based elements. Since this can cause unwanted behavior (i.e. Tree not rendering), only use this sparingly. To do this, use the `overrideClock` fixture as such:

```js
const { test, expect } = require('../../pluginFixtures.js');

test.describe('foo test suite', () => {
  
  // All subsequent tests in this suite will override the clock
  test.use({
    clockOptions: {
      now: 1732413600000, // A timestamp given as milliseconds since the epoch
      shouldAdvanceTime: true // Should the clock tick?
    }
  });

  test('bar test', async ({ page }) => {
    // ...
  });
});
  ```
  More info and options for `overrideClock` can be found in [baseFixtures.js](baseFixtures.js)

- Working with multiple pages
There are instances where multiple browser pages will needed to verify multi-page or multi-tab application behavior. Make sure to use the `@2p` annotation as well as name each page appropriately: i.e. `page1` and `page2` or `tab1` and `tab2` depending on the intended use case. Generally pages should be used unless testing `sharedWorker` code, specifically.

### Reporting

Test Reporting is done through official Playwright reporters and the CI Systems which execute them.

We leverage the following official Playwright reporters:

- HTML
- junit
- github annotations
- Tracefile
- Screenshots

When running the tests locally with the `npm run test:e2e:local` command, the html report will open automatically on failure. Inside this HTML report will be a complete summary of the finished tests. If the tests failed, you'll see embedded links to screenshot failure, execution logs, and the Tracefile.

When looking at the reports run in CI, you'll leverage this same HTML Report which is hosted either in CircleCI or Github Actions as a build artifact.

### e2e Code Coverage

Our e2e code coverage is captured and combined with our unit test coverage. For more information, please see our [code coverage documentation](../TESTING.md)

#### Generating e2e code coverage

Code coverage is collected during test execution using our custom [baseFixture](./baseFixtures.js). The raw coverage files are stored in a `.nyc_report` directory to be converted into a lcov file with the following [nyc](https://github.com/istanbuljs/nyc) command:

```npm run cov:e2e:report```

At this point, the nyc linecov report can be published to [codecov.io](https://about.codecov.io/) with the following command:

```npm run cov:e2e:stable:publish``` for the stable suite running in ubuntu.
or
```npm run cov:e2e:full:publish``` for the full suite running against all available platforms.

## Other

### About e2e testing

e2e testing is an industry-standard approach to automating the testing of web-based UIs such as Open MCT. Broadly speaking, e2e tests differentiate themselves from unit tests by preferring replication of real user interactions over execution of raw JavaScript functions.

Historically, the abstraction necessary to replicate real user behavior meant that:

- e2e tests were "expensive" due to how much code each test executed. The closer a test replicates the user, the more code is needed run during test execution. Unit tests could run smaller units of code more efficiently.
- e2e tests were flaky due to network conditions or the underlying protocols associated with testing a browser.
- e2e frameworks relied on a browser communication standard which lacked the observability and controls necessary needed to reach the code paths possible with unit and integration tests.
- e2e frameworks provided insufficient debug information on test failure

However, as the web ecosystem has matured to the point where mission-critical UIs can be written for the web (Open MCT), the e2e testing tools have matured as well. There are now fewer "trade-offs" when choosing to write an e2e test over any other type of test.

Modern e2e frameworks:

- Bypass the surface layer of the web-application-under-test and use a raw debugging protocol to observe and control application and browser state.
- These new browser-internal protocols enable near-instant, bi-directional communication between test code and the browser, speeding up test execution and making the tests as reliable as the application itself.
- Provide test debug tooling which enables developers to pinpoint failure

Furthermore, the abstraction necessary to run e2e tests as a user enables them to be extended to run within a variety of contexts. This matches the extensible design of Open MCT.

A single e2e test in Open MCT is extended to run:

- Against a matrix of browser versions.
- Against a matrix of OS platforms.
- Against a local development version of Open MCT.
- A version of Open MCT loaded as a dependency (VIPER, VISTA, etc)
- Against a variety of data sources or telemetry endpoints.

### Why Playwright?

[Playwright](https://playwright.dev/) was chosen as our e2e framework because it solves a few VIPER Mission needs:

1. First-class support for Automated Performance Testing
2. Official Chrome, Chrome Canary, and iPad Capabilities
3. Support for Browserless.io to run tests in a "hermetically sealed" environment
4. Ability to generate code coverage reports

### FAQ

- How does this help NASA missions?
- When should I write an e2e test instead of a unit test?
- When should I write a functional vs visual test?
- How is Open MCT extending default Playwright functionality?
- What about Component Testing?

### Troubleshooting

- Why is my test failing on CI and not locally?
- How can I view the failing tests on CI?
- Tests won't start because 'Error: <http://localhost:8080/># is already used...'
This error will appear when running the tests locally. Sometimes, the webserver is left in an orphaned state and needs to be cleaned up. To clear up the orphaned webserver, execute the following from your Terminal:
```lsof -n -i4TCP:8080 | awk '{print$2}' | tail -1 | xargs kill -9```

### Upgrading Playwright

In order to upgrade from one version of Playwright to another, the version should be updated in several places in both `openmct` and `openmct-yamcs` repos. An easy way to identify these locations is to search for the current version in all files and find/replace.

For reference, all of the locations where the version should be updated are listed below:

#### **In `openmct`:**

- `package.json`
  - Both packages `@playwright/test` and `playwright-core` should be updated to the same target version.
- `.circleci/config.yml`
- `.github/workflows/e2e-couchdb.yml`
- `.github/workflows/e2e-pr.yml`

#### **In `openmct-yamcs`:**

- `package.json`
  - `@playwright/test` should be updated to the target version.
- `.github/workflows/yamcs-quickstart-e2e.yml`
