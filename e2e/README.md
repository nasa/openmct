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

Visual Testing is an essential part of our e2e strategy as it ensures that the application appears correctly to a user while it functions correctly.

To make this possible, we're leveraging a 3rd party service, [Percy](https://percy.io/). This service maintains a copy of all changes, users, scm-metadata, and baselines to verify that the application looks and feels the same _unless approved by a Open MCT developer_.

Percy enables "change reviews" in the PR by taking simple snapshots of the application in time. For more information, please see the official [Percy documentation](https://docs.percy.io/docs/visual-testing-basics)

While visual testing is an essential part of our test strategy, it should still be executed through its own separate process.

`npm run test:e2e:visual` will run all of the visual tests against a local instance of Open MCT. If no `PERCY_TOKEN` API key is found in the terminal or command line environment variables, no visual comparisons will be made.

To request a Percy API token, please reach out to the Open MCT Dev team on GitHub.

For a better understanding of the visual issues which affect Open MCT, please see our bug tracker with the `label:visual` filter applied [here](https://github.com/nasa/openmct/issues?q=label%3Abug%3Avisual+)

### Snapshot Testing

- [Snapshots](https://playwright.dev/docs/test-snapshots)

#### How to write a good visual test

TBD

## Performance Testing

## Architecture, Test Design, and Best Practices <a name="architecture"></a>

### (TBD) Architecture

Visual tests should be written within the `./tests/visual` folder so that they can be ignored during git clones to avoid leaking credentials when executing Percy cli

### Configuration

- Open MCT is leveraging the [config file](link) pattern to describe the capabilities of Open MCT e2e _where_ it's run
- `./playwright-ci.config.js` - Used when running in CI
- `./playwright-local.config.js` - Used when running locally
- `./playwright-performance.config.js`
- `./playwright-visual.config.js`

#### (TBD) Continuous Integration

- Test Promotion
In order to maintain fast and reliable feedback, tests go through a promotion process. All new test cases or test suites must be labeled with the `@unstable` annotation. The Open MCT dev team runs these unstable tests in our private repos.

- Difference between full and e2e-ci suites
- Platforms

### (TBD) Multi-browser and Multi-operating system

- Where is it tested
- What's supported
- Mobile

### (TBD) Test Design

- How to make tests robust to function in other contexts (VISTA, VIPER, etc.)
  - Leverage the use of pluginFixtures.js like getOrCreateDomainObject
- How to make tests faster and more resilient
  - When possible, navigate directly by URL
  - Leverage ```await page.goto('/', { waitUntil: 'networkidle' });```
  - Avoid repeated setup to test to test a single assertion. Write longer tests with multiple soft assertions.

#### Annotations

- Annotations are a great way of organizing tests outside of a file structure.
- Current list of annotations:
  - `@ipad` - Mobile execution possible with Playwright's iPad support.
  - `@gds` - Executes a GDS Test Case in VIPER Mission.
  - `@addInit` - Initializes the browser with an injected and artificial state. Useful for non-default plugins. Likely will not work outside of app.js.
  - `@localStorage` - Captures or generates session storage to manipulate browser state. Useful for excluding in tests which require a persistent backend (i.e. CouchDB).
  - `@snapshot` - Uses Playwright's snapshot functionality to record a copy of the DOM for direct comparison. Must be run inside of a container.
  - `@unstable` - A new test or test which is known to be flaky.

### (TBD) Best Practices

### (TBD) Reporting

### (TBD) Code Coverage

Code coverage is collected during test execution and reported with [nyc](https://github.com/istanbuljs/nyc) and [codecov.io](https://about.codecov.io/)

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
