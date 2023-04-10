# Testing
Open MCT Testing is iterating and improving at a rapid pace. This document serves to capture and index existing testing documentation and house documentation which no other obvious location as our testing evolves.

## General Testing Process
Documentation located [here](./docs/src/process/testing/plan.md)

## Unit Testing
Unit testing is essential part of our test strategy and complements our e2e testing strategy.

#### Unit Test Guidelines
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

#### Unit Test Examples
* [Example of an automated test spec for an object view plugin](https://github.com/nasa/openmct/blob/master/src/plugins/telemetryTable/pluginSpec.js)
* [Example of an automated test spec for API](https://github.com/nasa/openmct/blob/master/src/api/time/TimeAPISpec.js)

#### Unit Testing Execution

The unit tests can be executed in one of two ways:
`npm run test` which runs the entire suite against headless chrome
`npm run test:debug` for debugging the tests in realtime in an active chrome session.

## e2e, performance, and visual testing
Documentation located [here](./e2e/README.md)

## Code Coverage

* 100% statement coverage is achievable and desirable.

Codecov.io will combine each of the above commands with [Codecov.io Flags](https://docs.codecov.com/docs/flags). Effectively, this allows us to combine multiple reports which are run at various stages of our CI Pipeline or run as part of a parallel process.

This e2e coverage is combined with our unit test report to give a comprehensive (if flawed) view of line coverage.

### Limitations in our code coverage reporting

Our code coverage implementation has two known limitations:
- [Variability and accuracy](https://github.com/nasa/openmct/issues/5811)
- [Vue instrumentation](https://github.com/nasa/openmct/issues/4973)
