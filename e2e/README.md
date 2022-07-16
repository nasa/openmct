# e2e testing

This document captures information specific to the e2e testing of Open MCT. For general information about testing, please see [the Open MCT README](https://github.com/nasa/openmct/blob/master/README.md#tests).

## Overview

This document is designed to capture on the What, Why, and How's of writing and running e2e tests in Open MCT.

### About e2e testing

e2e testing is an industry-standard approach to automating the testing of web-based UIs such as Open MCT. Broadly speaking, e2e tests differentiate themselves from unit tests by preferring replication of real user interactions over execution of raw JavaScript functions.

Historically, the abstraction necessary to replicate real user behavior meant that:

- e2e tests were "expensive" due to how much code each test executed. The closer a test replicates the user, the more code is needed run during test execution. Unit tests could run smaller units of code more effeciently.
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
3. Support for Browserless.io
4. Ability to generate code coverage reports

## Getting Started

### Getting started with Playwright

### Getting started with Open MCT's implementation of Playwright

## Types of Testing

### (TBD) Visual Testing

- Visual tests leverage [Percy](https://percy.io/).
- Visual tests should be written within the `./tests/visual` folder so that they can be ignored during git clones to avoid leaking credentials when executing percy cli

#### (TBD) How to write a good visual test

### (TBD) Snapshot Testing

<https://playwright.dev/docs/test-snapshots>

### (TBD) Mobile Testing

### (TBD) Performance Testing

### (FUTURE) Component Testing

- Component testing is currrently possible in Playwright but not enabled on this project. For more, please see: <https://playwright.dev/docs/test-components>

## Architecture, Test Design and Best Practices

### (TBD) Architecture

#### (TBD)  Continuous Integration

- Test maturation
- Difference between full and e2e-ci suites
- Platforms

### (TBD) Multi-browser and Multi-operating system

- Where is it tested
- What's supported

### (TBD) Test Design

- Re-usable tests for VISTA, VIPER, etc.

#### Annotations

- Annotations are a great way of organizing tests outside of a file structure.
- Current list of annotations:
  - `@ipad` - Mobile execution possible with Playwright's iPad support.
  - `@gds` - Executes a GDS Test Case. Used to track in VIPER Mission.
  - `@addInit` - Initializes the browser with an injected and artificial state. Useful for non-default plugins.
  - `@localStorage` - Captures or generates session storage to manipulate browser state. Useful for excluding in tests which require a persistent backend (i.e. CouchDB).
  - `@snapshot` - Uses Playwright's snapshot functionality to record a copy of the DOM for direct comparison. Must be run inside of a container.

### (TBD) Best Practices

### (TBD) Reporting

### (TBD) Code Coverage

Code coverage is collected during test execution and reported with [nyc](https://github.com/istanbuljs/nyc) and [codecov.io](https://about.codecov.io/)

## Other

### FAQ

- How does this help NASA missions?
- When should I write an e2e test instead of a unit test?
- When should I write a functional vs visual test?
- How is Open MCT extending default Playwright functionality?

### Troubleshooting

- Why is my test failing on CI and not locally?
- How can I view the failing tests on CI?
