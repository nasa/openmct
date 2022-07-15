# e2e Testing

This document captures information specific to e2e testing of Open MCT. For general information about testing, please see [testing section](link to testing section).

## Overview

e2e testing, sometimes known as "end to end" testing is an industry standard approach to automating the testing of Web UIs like Open MCT. Broadly speaking, e2e tests differentiate themselves in that they err on the side of replicating real user interaction over executing raw javascript functions like unit tests. 

Historically, the abstraction necessary to replicate real user behavior meant:
- that e2e frameworks were not capable of validing codepaths which were only reachable by unit tests
- were expensive to run due to the need to instantiate a real browser
- were flaky due to network conditions or the underlying protocols associated with testing a browser. 

However, as the web ecosystem has matured to the point where Mission Critical UIs are written for the Web (Open MCT), the e2e testing tools improved along with them. There are now fewer "trade-offs" when chosing to write an e2e test over any other type of test. Modern e2e frameworks:
- enable browsers and web applications to reach 'mocked' states to cover deeper codepaths without mocking the browser, itself
- have direct access to javascript component libraries like vue.js props
- are now more reliable than the application-under-test due to raw and native access to browser-internal protocols. 
- These new browser-internal protocols enable near-instant bi-directional communication between test code browser speeding up test execution and making the tests as reliable as the application, itself

Furthermore, the abstraction necessary to run e2e tests as a user, better enables them to be extended to run in a variety of contexts. This matches the extensible design of Open MCT. A single e2e test in Open MCT is extended to run:
- Against a matrix of browser versions
- Against a matrix of OS platforms
- Against a local development version of openmct
- A version of Open MCT loaded as a depency (VIPER, VISTA, etc)

## Getting Started

### Getting started with Playwright

### Getting started with Open MCT's implementation of Playwright

## Types of Testing

### (TBD) Visual Testing

- Visual tests leverage percy.io
- Visual tests should be written within the ./tests/visual folder so that they can be ignored during git clones to avoid leaking credentials when executing percy cli
- How to write a good visual test

### (TBD) Snapshot Testing

https://playwright.dev/docs/test-snapshots

### (TBD) Mobile Testing

### (TBD) Performance Testing

### (FUTURE) Component Testing
- Component testing is currrently possible in playwright but not enabled on this project. For more, please see:

## Architecture, Test Design and Best Practices

### (TBD) Architecture

#### (TBD)  Continuous Integration
- Test Maturation 
- Difference between full and e2e-ci suites
- Platforms

### (TBD) Multi-browser and Multi-operating system
- Where is it tested
- What's supported
### (TBD) Test Design

- Re-usable tests for VISTA, VIPER, etc.
- Re-usable tests for 

#### Annotations

 - Annotations are a great way of organizing tests outside of a file structure.
 - Current list of annotations:
    - @ipad - Mobile execution possible with playwright's iPad support
    - @gds - Executes a GDS Test Case. Used to track in VIPER Mission
    - @addInit - Initializes the browser with an injected and artificial state. Useful for non-default plugins
    - @localStorage - Captures or generates session storage to manipulate browser state. Useful for excluding in tests which require a persistent backend (i.e. CouchDB)
    - @snapshot - Uses playwright's snapshot functionality to record a copy of the DOM for direct comparison. Must be run inside of a container.

### (TBD) Best Practices

### (TBD) Reporting

### (TBD) Code Coverage

Code coverage is collected during test execution and reported with nyc and codecov.io

## Other

### FAQ
- How does this help NASA Missions?
- When Should I write an e2e test instead of a unit test?
- When should I write a functional vs visual test?
- How is Open MCT extending default Playwright functionality?

### Troubleshooting
- Why is my test failing on CI and not locally?
- How can I view the failing tests on CI?
