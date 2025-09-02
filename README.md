# Open MCT [![license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0) [![codecov](https://codecov.io/gh/nasa/openmct/branch/master/graph/badge.svg?token=7DQIipp3ej)](https://codecov.io/gh/nasa/openmct) [![This project is using Percy.io for visual regression testing.](https://percy.io/static/images/percy-badge.svg)](https://percy.io/b2e34b17/openmct) [![npm version](https://img.shields.io/npm/v/openmct.svg)](https://www.npmjs.com/package/openmct) ![CodeQL](https://github.com/nasa/openmct/workflows/CodeQL/badge.svg)

Open MCT (Open Mission Control Technologies) is a next-generation mission control framework for visualization of data on desktop and mobile devices. It is developed at NASA's Ames Research Center, and is being used by NASA for data analysis of spacecraft missions, as well as planning and operation of experimental rover systems. As a generalizable and open source framework, Open MCT could be used as the basis for building applications for planning, operation, and analysis of any systems producing telemetry data.

> [!NOTE]
> Please visit our [Official Site](https://nasa.github.io/openmct/) and [Getting Started Guide](https://nasa.github.io/openmct/getting-started/)

Once you've created something amazing with Open MCT, showcase your work in our GitHub Discussions [Show and Tell](https://github.com/nasa/openmct/discussions/categories/show-and-tell) section. We love seeing unique and wonderful implementations of Open MCT!

![Screen Shot 2022-11-23 at 9 51 36 AM](https://user-images.githubusercontent.com/4215777/203617422-4d912bfc-766f-4074-8324-409d9bbe7c05.png)

## Building and Running Open MCT Locally

Building and running Open MCT in your local dev environment is very easy. Be sure you have [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/) installed, then follow the directions below. Need additional information? Check out the [Getting Started](https://nasa.github.io/openmct/getting-started/) page on our website.
(These instructions assume you are installing as a non-root user; developers have [reported issues](https://github.com/nasa/openmct/issues/1151) running these steps with root privileges.)

1. Clone the source code:

```sh
git clone https://github.com/nasa/openmct.git
```

2. (Optional) Install the correct node version using [nvm](https://github.com/nvm-sh/nvm):

```sh
nvm install
```

3. Install development dependencies (Note: Check the `package.json` engine for our tested and supported node versions):

```sh
npm install
```

4. Run a local development server:

```
npm start
```

> [!IMPORTANT]
> Open MCT is now running, and can be accessed by pointing a web browser at [http://localhost:8080/](http://localhost:8080/)

Open MCT is built using [`npm`](http://npmjs.com/) and [`webpack`](https://webpack.js.org/).

## Documentation

Documentation is available on the [Open MCT website](https://nasa.github.io/openmct/documentation/).

### Examples

The clearest examples for developing Open MCT plugins are in the
[tutorials](https://github.com/nasa/openmct-tutorial) provided in
our documentation.

> [!NOTE]
> We want Open MCT to be as easy to use, install, run, and develop for as
> possible, and your feedback will help us get there!
> Feedback can be provided via [GitHub issues](https://github.com/nasa/openmct/issues/new/choose),
> [Starting a GitHub Discussion](https://github.com/nasa/openmct/discussions),
> or by emailing us at [arc-dl-openmct@mail.nasa.gov](mailto:arc-dl-openmct@mail.nasa.gov).

## Developing Applications With Open MCT

For more on developing with Open MCT, see our documentation for a guide on [Developing Applications with Open MCT](./API.md#starting-an-open-mct-application).

## Compatibility

This is a fast moving project and we do our best to test and support the widest possible range of browsers, operating systems, and NodeJS APIs. We have a published list of support available in our package.json's `browserslist` key.

The project utilizes `nvm` to maintain consistent node and npm versions across all projects. For UNIX, MacOS, Windows WSL, and other POSIX-compliant shell environments, click [here](https://github.com/nvm-sh/nvm). For Windows, check out [nvm-windows](https://github.com/coreybutler/nvm-windows).

If you encounter an issue with a particular browser, OS, or NodeJS API, please [file an issue](https://github.com/nasa/openmct/issues/new/choose).

## Plugins

Open MCT can be extended via plugins that make calls to the Open MCT API. A plugin is a group
of software components (including source code and resources such as images and HTML templates)
that is intended to be added or removed as a single unit.

As well as providing an extension mechanism, most of the core Open MCT codebase is also
written as plugins.

For information on writing plugins, please see [our API documentation](./API.md#plugins).

## Tests

Our automated test coverage comes in the form of unit, e2e, visual, performance, and security tests.

### Unit Tests

Unit Tests are written for [Jasmine](https://jasmine.github.io/api/edge/global)
and run by [Karma](http://karma-runner.github.io). To run:

`npm test`

The test suite is configured to load any scripts ending with `Spec.js` found
in the `src` hierarchy. Full configuration details are found in
`karma.conf.js`. By convention, unit test scripts should be located
alongside the units that they test; for example, `src/foo/Bar.js` would be
tested by `src/foo/BarSpec.js`.

### e2e, Visual, and Performance Testing

Our e2e (end-to-end), Visual, and Performance tests leverage the Playwright framework and are executed using Playwright's test runner, [@playwright/test](https://playwright.dev/).

#### How to Run Tests

- **e2e Tests**: These tests are run on every commit. To run the tests locally, use:

  ```sh
  npm run test:e2e:ci
  ```

- **Visual Tests**: For running the visual test suite, use:

  ```sh
  npm run test:e2e:visual
  ```

- **Performance Tests**: To initiate the performance tests, enter:

  ```sh
  npm run test:perf
  ```

All tests are located within the `e2e/tests/` directory and are identified by the `*.e2e.spec.js` filename pattern. For more information about the e2e test suite, refer to the [README](./e2e/README.md).

### Security Tests

Each commit is analyzed for known security vulnerabilities using [CodeQL](https://codeql.github.com/docs/codeql-language-guides/codeql-library-for-javascript/). The list of CWE coverage items is available in the [CodeQL docs](https://codeql.github.com/codeql-query-help/javascript-cwe/). The CodeQL workflow is specified in the [CodeQL analysis file](./.github/workflows/codeql-analysis.yml) and the custom [CodeQL config](./.github/codeql/codeql-config.yml).

### Test Reporting and Code Coverage

Each test suite generates a report in CircleCI. For a complete overview of testing functionality, please see our [Circle CI Test Insights Dashboard](https://app.circleci.com/insights/github/nasa/openmct/workflows/the-nightly/overview?branch=master&reporting-window=last-30-days)

Our code coverage is generated during the runtime of our unit, e2e, and visual tests. The combination of those reports is published to [codecov.io](https://app.codecov.io/gh/nasa/openmct/)

For more on the specifics of our code coverage setup, [see](TESTING.md#code-coverage)

## Glossary

Certain terms are used throughout Open MCT with consistent meanings
or conventions. Any deviations from the below are issues and should be
addressed (either by updating this glossary or changing code to reflect
correct usage.) Other developer documentation, particularly in-line
documentation, may presume an understanding of these terms.
| Term          | Definition                                                                                                                                                                                                                                                                                                                                                   |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| _plugin_      | A removable, reusable grouping of software elements. The application is composed of plugins.                                                                                                                                                                                                                                                                  |
| _composition_ | In the context of a domain object, this term refers to the set of other domain objects that compose or are contained by that object. A domain object's composition is the set of domain objects that should appear immediately beneath it in a tree hierarchy. It is described in its model as an array of ids, providing a means to asynchronously retrieve the actual domain object instances associated with these identifiers. |
| _description_ | When used as an object property, this term refers to the human-readable description of a thing, usually a single sentence or short paragraph. It is most often used in the context of extensions, domain object models, or other similar application-specific objects.                                                                                           |
| _domain object_ | A meaningful object to the user and a distinct thing in the work supported by Open MCT. Anything that appears in the left-hand tree is a domain object.                                                                                                                                                                                                       |
| _identifier_  | A tuple consisting of a namespace and a key, which together uniquely identifies a domain object.                                                                                                                                                                                                                                                              |
| _model_       | The persistent state associated with a domain object. A domain object's model is a JavaScript object that can be converted to JSON without losing information, meaning it contains no methods.                                                                                                                                                                 |
| _name_        | When used as an object property, this term refers to the human-readable name for a thing. It is most often used in the context of extensions, domain object models, or other similar application-specific objects.                                                                                                                                             |
| _navigation_  | This term refers to the current state of the application with respect to the user's expressed interest in a specific domain object. For example, when a user clicks on a domain object in the tree, they are navigating to it, and it is thereafter considered the navigated object until the user makes another such choice.                                    |
| _namespace_   | A name used to identify a persistence store. A running Open MCT application could potentially use multiple persistence stores.                                                                                                                                                                                                                                 |

## Open MCT v2.0.0

Support for our legacy bundle-based API, and the libraries that it was built on (like Angular 1.x), have now been removed entirely from this repository.

For now if you have an Open MCT application that makes use of the legacy API, [a plugin](https://github.com/nasa/openmct-legacy-plugin) is provided that bootstraps the legacy bundling mechanism and API. This plugin will not be maintained over the long term however, and the legacy support plugin will not be tested for compatibility with future versions of Open MCT. It is provided for convenience only.

### How do I know if I am using legacy API?

You might still be using legacy API if your source code

- Contains files named bundle.js, or bundle.json,
- Makes calls to `openmct.$injector()`, or `openmct.$angular`,
- Makes calls to `openmct.legacyRegistry`, `openmct.legacyExtension`, or `openmct.legacyBundle`.

### What should I do if I am using legacy API?

Please refer to [the modern Open MCT API](https://nasa.github.io/openmct/documentation/). Post any questions to the [Discussions section](https://github.com/nasa/openmct/discussions) of the Open MCT GitHub repository.

## Related Repos

> [!NOTE]
> Although Open MCT functions as a standalone project, it is primarily an extensible framework intended to be used as a dependency with users' own plugins and packaging. Furthermore, Open MCT is intended to be used with an HTTP server such as Apache or Nginx. A great example of hosting Open MCT with Apache is `openmct-quickstart` and can be found in the table below.

| Repository | Description |
| --- | --- |
| [openmct-tutorial](https://github.com/nasa/openmct-tutorial) | A great place for beginners to learn how to use and extend Open MCT. |
| [openmct-quickstart](https://github.com/scottbell/openmct-quickstart) | A working example of Open MCT integrated with Apache HTTP server, YAMCS telemetry, and Couch DB for persistence.
| [Open MCT YAMCS Plugin](https://github.com/akhenry/openmct-yamcs) | Plugin for integrating YAMCS telemetry and command server with Open MCT. |
| [openmct-performance](https://github.com/unlikelyzero/openmct-performance) | Resources for performance testing Open MCT. |
| [openmct-as-a-dependency](https://github.com/unlikelyzero/openmct-as-a-dependency) | An advanced guide for users on how to build, develop, and test Open MCT when it's used as a dependency. |

