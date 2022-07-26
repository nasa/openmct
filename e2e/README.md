# e2e testing

This document captures information specific to the e2e testing of Open MCT. For general information about testing, please see [the Open MCT README](https://github.com/nasa/openmct/blob/master/README.md#tests).

## Overview

This document is designed to capture on the What, Why, and How's of writing and running e2e tests in Open MCT. 

1. [Getting Started](#GettingStarted)
2. [Types of Testing](#typesoftesting)
3. [Architecture and Test Design](#architecture)

## Getting Started <a name="gettingstarted"></a>

While our team does our best to lower the barrier to entry to working with our e2e framework and Open MCT, there is a bit of work required to get from 0 to 1 test contributed.

### Getting started with Playwright

If this is your first time ever using the Playwright framework, we recommend going through the [Getting Started Guide](https://playwright.dev/docs/next/intro) which can be completed in about 15 minutes. This will give you a concise tour of Playwright's functionality and an understanding of the official Playwright documentation which we leverage in Open MCT.

### Getting started with Open MCT's implementation of Playwright

Once you've got an understanding of Playwright, you'll need a baseline understanding of Open MCT:

1. Follow the steps [Building and Running Open MCT Locally](../README.md#building-and-running-open-mct-locally)
2. Once you're serving Open MCT locally, create an Example Telemetry Object (e.g.: 'Sine Wave Generator')
3. Create a 'Plot' Object (e.g.: 'Stacked Plot')
4. Expand the Tree on the left-hand nav and drag and drop the Example Telemetry Object into the Plot Object
5. Create a 'Display Layout' object
6. From the Tree, Drag the Plot object into the Display Layout

What you've created is a display which mimics the display that a mission control operator might use to understand and model telemetry data.

Recreate the steps above with Playwright's codegen tool:

1. `npm run start` in a terminal window
2. Open another terminal window and start the Playwright codegen application `npx playwright codegen`
3. Navigate the browser to `http://localhost:8080`
4. Click the Create button and notice how your actions in the browser are being recorded in the Playwright Inspector
5. Continue through the steps 2-6 above

What you've created is an automated test which mimics the creation of a mission control display.

Next, you should walk through our implementation of Playwright in Open MCT:

1. Close any terminals which are serving up a local instance of Open MCT
2. Run our 'Getting Started' test in debug mode with `npm run test:e2e:local -- exampleTemplate --debug`
3. Step through each test step in the Playwright Inspector to see how we leverage Playwright's capabilities to test Open MCT

## Types of e2e Testing <a name="typesoftesting"></a>

e2e testing describes the layer at which a test is performed without prescribing the assertions which are made. Generally, when writing an e2e test, we have three choices:

1. Functional - Verifies the functional correctness of the application
2. Visual - Verifies the "look and feel" of the application and can only detect _undesirable changes_.
3. Snapshot - Similar to Visual in that it captures the "look" of the application and can only detect _undesirable changes_. **Generally not preferred due to the maintenance costs of the associated.**

When choosing between the different testing strategies, think only about the assertion that is made at the end of the series of test steps. "I want to verify that the Timer plugin functions correctly" vs "I want to verify that the Timer plugin does not look different than originally designed".

We do not want to interleave visual and functional testing because visual test verification of correctness must happen with a 3rd party service. This service is not available when executing these tests in other contexts (i.e. VIPER).

### Functional Testing

The bulk of our e2e coverage lies in "functional" test coverage which verifies that Open MCT is functionally correct as well as defining _how we expect it to behave_. This enables us to test the application exactly as a user would, while prescribing exactly how a user can interact with the application via a web browser.

Our functional tests end in `*.e2e.spec.js` and mirror the `src` structure of the application where appropriate.

### Visual Testing

Visual Testing is an essential part of our e2e strategy as it ensures that the application appears correctly to a user while it functions correctly. It 

To make this possible, we're leveraging a 3rd party service, [Percy](https://percy.io/). This service maintains a copy of all changes, users, scm-metadata, and baselines to verify that the application looks and feels the same _unless approved by a Open MCT developer_.

Percy enables "change reviews" in the PR by taking simple snapshots of the application in time. For more information, please see the official [Percy documentation](https://docs.percy.io/docs/visual-testing-basics)

While visual testing is an essential part of our test strategy, it needs to be executed out of band because the tests are more prone to flake and require some heavily controlled environments.

`npm run test:e2e:visual` will run all of the visual tests against a local instance of Open MCT. If no `PERCY_TOKEN` API key is found in the terminal or command line environment variables, no visual comparisons will be made.

To request a Percy API token, please reach out to the Open MCT Dev team on GitHub.

For a better understanding of the visual issues which affect Open MCT, please see our bug tracker with the `label:visual` filter applied [here](https://github.com/nasa/openmct/issues?q=label%3Abug%3Avisual+)

### (Advanced) Snapshot Testing

Snapshot testing is very similar in functionality to visual testing but allows us to be more precise in detecting change. Unfortuantely, this precision requires advanced test setup and teardown and so we're strategic investment in this area.

Read more about [Playwright Snapshots](https://playwright.dev/docs/test-snapshots)

Open MCT's implementation
-Our Snapshot tests receive a @snapshot tag.
-Snapshots need to be executed within the official playwright container to ensure we're using the exact rendering platform in CI and locally

```
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:[GET THIS VERSION FROM OUR CIRCLECI CONFIG FILE]-focal /bin/bash
npm install
npx playwright test --config=e2e/playwright-ci.config.js --project=chrome --grep @snapshot
```

(Active Development) Updating Snapshots
When the @snapshot tests fail, they will need to be evaluated to see if the failure is an acceptable change or 
#### How to write a good visual test

TBD

## Performance Testing

The open source performance tests function mostly as a contract for the locator logic, functionality, and assumptions will work in our downstream, closed source test suites.

They're found in the `/e2e/tests/performance` repo and are to be executed with the following npm script:

```npm run test:perf```

These tests are expected to become blocking and gating with assertions as we extend the base capabilities of playwright.
## Test Architecture and CI <a name="architecture"></a>

### Architecture

Visual tests should be written within the `./tests/visual` folder so that they can be ignored during git clones to avoid leaking credentials when executing Percy cli

### Test Case Organization


### Configuration

Where possible, we try to run Open MCT without modification or configuration change so that the Open MCT doesn't fail exclusively in "test mode" or in "production mode".

Open MCT is leveraging the [config file](https://playwright.dev/docs/test-configuration) pattern to describe the capabilities of Open MCT e2e _where_ it's run
- `./playwright-ci.config.js` - Used when running in CI or to debug CI issues locally
- `./playwright-local.config.js` - Used when running locally
- `./playwright-performance.config.js` - Used when running performance tests in CI or locally
- `./playwright-visual.config.js` - Used to run the visual tests in CI or locally

### Continuous Integration

The cheapest time to catch a bug is pre-merge. Unfortuantely, this is the most expensive time to run all of the tests since each Merge can consistent of hundreds of commits. For this reason, we're selective in _what_ we run as much as _when_ we run it.

We leverage CircleCI to run tests against each commit and inject the Test Reports which are generated by playwright so that they team can keep track of flaky and [historical Test Trends](https://app.circleci.com/insights/github/nasa/openmct/workflows/overall-circleci-commit-status/tests?branch=master&reporting-window=last-30-days)

We leverage Github Actions / Workflows to execute tests as it gives us the ability to run against multiple operating systems with greater control over git event triggers (i.e. Run on a PR Comment event).

Our CI environment consists of 3 main modes of operation:

#### 1. Per-Commit Testing
CircleCI
- Stable e2e tests against ubuntu and chrome
- Performance tests against ubuntu and chrome
- e2e tests are linted

#### 2. Per-Merge Testing
Github Actions / Workflow
- Full suite against all browsers/projects. Triggered with Github Label Event 'pr:e2e'
- Visual Tests. Triggered with Github Label Event 'pr:visual'

#### 3. Scheduled / Batch Testing
Nightly Testing in Circle CI
- Full e2e suite against ubuntu and chrome
- Performance tests against ubuntu and chrome

Github Actions / Workflow
- Visual Test baseline generation.

#### Parallelism and Fast Feedback
In order to provide fast feedback in the Per-Commit context, we try to keep total test feedback at 5 minutes or less. That is to say, A developer should have a pass/fail result in under 5 minutes.

Playwright has native support for semi-intelligent sharding. Read about it [here](https://playwright.dev/docs/test-parallel#shard-tests-between-multiple-machines).

We will be adjusting the parallelization of the Per-Commit tests to keep below the 5 minute total runtime threshold.

In addition to the Parallelization of Test Runners (Sharding), we're also running two concurrent threads on every Shard. This is the functional limit of what CircelCI Agents can support from a memory and CPU resource constraint.

So for every commit, Playwright is effectively running 4 x 2 concurrent browsercontexts to keep the overall runtime to a miminum.

At the same time, we don't want to waste CI resources on parallel runs, so we've configured each shard to fail after 5 test failures. Test failure logs are recorded and stored to allow fast triage.
#### Test Promotion

In order to maintain fast and reliable feedback, tests go through a promotion process. All new test cases or test suites must be labeled with the `@unstable` annotation. The Open MCT dev team runs these unstable tests in our private repos to ensure they work downstream and are reliable.

To run the stable tests, use the ```npm run test:e2e:stable``` command. To run the new and flaky tests, use the ```npm run test:e2e:unstable``` command.

A testcase and testsuite are to be unmarked as @unstable when:
1. They run as part of "full" run 5 times without failure.
2. They've been by a Open MCT Developer 5 times in the closed source repo without failure.

### Cross-browser and Cross-operating system

- Where is it tested
- What's supported
- Mobile
#### Test Tags

- Test tags are a great way of organizing tests outside of a file structure
- Current list of test tags:
  - `@ipad` - Denotes that the testcase is compatible with Playwright's iPad support and Open MCT's read-only mobile view (i.e. no Create button).
  - `@gds` - Denotes a GDS Test Case used in the VIPER Mission.
  - `@addInit` - Initializes the browser with an injected and artificial state. Useful for non-default plugins. Likely will not work outside of app.js.
  - `@localStorage` - Captures or generates session storage to manipulate browser state. Useful for excluding in tests which require a persistent backend (i.e. CouchDB).
  - `@snapshot` - Uses Playwright's snapshot functionality to record a copy of the DOM for direct comparison. Must be run inside of the playwright container.
  - `@unstable` - A new test or test which is known to be flaky.

## Test Design, Best Practices, and Tips & Tricks

### Test Design

- How to make tests robust to function in other contexts (VISTA, VIPER, etc.)
  - Leverage the use of appActions.js like getOrCreateDomainObject
  - Leve
- How to make tests faster and more resilient
  - When possible, navigate directly by URL
  - Leverage ```await page.goto('/', { waitUntil: 'networkidle' });```
  - Avoid repeated setup to test to test a single assertion. Write longer tests with multiple soft assertions.

### Best Practices

For now, our best practices exist as self-tested living documentation in our [exampleTemplate.e2e.spec.js](./tests/framework/exampleTemplate.e2e.spec.js) file.

### Tips & Tricks

The following contains a list of tips and tricks which don't exactly fit into a FAQ or Best Practices doc.

- Working with multiple pages
There are instances where multiple browser pages will need to be opened to verify multi-page or multi-tab application behavior.

### Reporting

We leverage the following official Playwright reporters:
- HTML
- junit
- github annotations
- Tracefile

When running the tests locally with the `npm run test:local` command, the html report will open automatically on failure. Inside this HTML report will be a complete summary of the finished tests. If the tests failed, you'll see embedded links to screenshot failure, execution logs, and the Tracefile.

When looking at the reports run in CI, you'll leverage this same HTML Report which is hosted either in CircleCI or Github Actions as a build artifact.
### e2e Code Coverage

Code coverage is collected during test execution using our custom [baseFixture](./baseFixtures.js). The raw coverage files are stored in a `.nyc_report` directory to be converted into a lcov file with the following [nyc](https://github.com/istanbuljs/nyc) command:

```npm run cov:e2e:report```

At this point, the nyc linecov report can be published to [codecov.io](https://about.codecov.io/) with the following command:

```npm run cov:e2e:stable:publish``` for the stable suite running in ubuntu. 
or 
```npm run cov:e2e:full:publish``` for the full suite running against all available platforms.

Codecov.io will combine each of the above commands with it's 'Flag' system. Effectively, this allows us to combine multiple reports which are run at various stages of our CI Pipeline or run as part of a parallel process.

This e2e coverage is combined with our unit test report to give a comprehensive (if flawed) view of line coverage.
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
- Tests won't start because 'Error: http://localhost:8080/# is already used...'
This error will appear when running the tests locally. Sometimes, the webserver is left in an orphaned state and needs to be cleaned up. To clear up the orphaned webserver, execute the following from your Terminal:
```lsof -n -i4TCP:8080 | awk '{print$2}' | tail -1 | xargs kill -9```
