# End-to-End Testing (e2e)

This document captures information specific to end-to-end testing of Open MCT. For general information about testing, please see [the Open MCT README](https://github.com/nasa/openmct/blob/master/README.md#tests).

## Overview

End-to-End testing, commonly referred to as "e2e" testing is an industry-standard approach to automating the testing of web-based UIs such as Open MCT. Broadly speaking, e2e tests differentiate themselves from unit tests by preferring replication of real user interactions over execution of raw JavaScript functions.

Historically, the abstraction necessary to replicate real user behavior meant that:

- e2e frameworks were not capable of validating codepaths which were only reachable by unit tests.
- e2e tests were expensive to run due to the need to instantiate a real browser.
- e2e tests were flaky due to network conditions or the underlying protocols associated with testing a browser.

However, as the web ecosystem has matured to the point where mission-critical UIs can be written for the web (Open MCT), the e2e testing tools have matured as well. There are now fewer "trade-offs" when choosing to write an e2e test over any other type of test.

Modern e2e frameworks:

- Enable browsers and web applications to reach 'mocked' states to cover deeper codepaths without mocking the browser itself.
- Have direct access to JavaScript component libraries such as Vue.js props.
- Are now more reliable than the application-under-test due to raw and native access to browser-internal protocols.
- These new browser-internal protocols enable near-instant, bi-directional communication between test code and the browser, speeding up test execution and making the tests as reliable as the application itself.

Furthermore, the abstraction necessary to run e2e tests as a user enables them to be extended to run within a variety of contexts. This matches the extensible design of Open MCT. 

A single e2e test in Open MCT is extended to run:

- Against a matrix of browser versions.
- Against a matrix of OS platforms.
- Against a local development version of Open MCT.
- A version of Open MCT loaded as a dependency (VIPER, VISTA, etc)

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
