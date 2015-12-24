# API Refactoring

This document summarizes a path toward implementing API changes
from the [API Redesign](../proposals/APIRedesign.md) for Open MCT Web
v1.0.0.

# Goals and Priorities

These plans are intended to minimize:

* Waste; avoid allocating effort to temporary changes.
* Downtime; avoid making changes in large increments that blocks
  delivery of new features for substantial periods of time.
* Risk; ensure that changes can be validated quickly, avoid putting
  large effort into changes that have not been validated.

# Plan

## Step 1. Imperative bundle registration

Register whole bundles imperatively, using their current format.

For example, in each bundle add a `bundle.js` file:

```js
define([
    'mctRegistry',
    'json!bundle.json'
], function (mctRegistry, bundle) {
    mctRegistry.install(bundle, "path/to/bundle");
});
```

Where `mctRegistry.install` is placeholder API that wires into the
existing bundle registration mechanisms. The framework layer and
main point of entry would need to be adapted to (a) clearly depend
on these bundles, in the require sense of a dependency, and
(b)

Benefits:

* Achieves an API Redesign goal with minimal immediate effort.
* Conversion to an imperative syntax may be trivially automated.
* Minimal change; reuse existing bundle definitions, primarily.
* Allows early validation of switch to imperative; unforeseen
  consequences of the change may be detected at this point.
* Allows implementation effort to progress in parallel with decisions
  about API changes, including fundamental ones such as the role of
  Angular. May act in some sense as a prototype to inform those
  decisions.
* Creates a location (framework layer) where subsequent changes to
  the manner in which extensions are registered may be centralized.
  When there is a one-to-one correspondence between the existing
  form of an extension and its post-refactor form, adapters can be
  written here to defer the task of making changes ubiquitously
  throughout bundles, allowing for earlier validation and
  verification of those changes, and avoiding ubiquitous changes
  which might require us to go dark.

Detriments:

* Requires transitional API to be implemented/supported; this is
  waste. May mitigate this by time-bounding the effort put into
  this step to ensure that waste is minimal.

Note that API changes at this point do not meaningfully reflect
the desired 1.0.0 API, so no API reviews are necessary.

## Step 2. Incorporate a build step

After the previous step is completed, there should be a
straightforward dependency graph among AMD modules, and an
imperative (albeit transitional) API allowing for other plugins
to register themselves. This should allow for a build step to
be included in a straightforward fashion.

Some goals for this build step:

* Compile (and, preferably, optimize/minify) Open MCT Web
  sources into a single `.js` file.
  * It is desirable to do the same for HTML sources, but
    may wish to defer this until a subsequent refactoring
    step if appropriate.
* Provide non-code assets in a format that can be reused by
  derivative projects in a straightforward fashion.

Should also consider which dependency/packaging manager should
be used by dependent projects to obtain Open MCT Web. Approaches
include:

1. Plain `npm`. Dependents then declare their dependency with
   `npm` and utilize built sources and assets in a documented
   fashion. (Note that there are
   [documented challenges](http://blog.npmjs.org/post/101775448305/npm-and-front-end-packaging)
   in using `npm` in this fashion.)
2. Build with `npm`, but recommend dependents install using
   `bower`, as this is intended for front-end development. This may
   require checking in built products, however, which
   we wish to avoid (this could be solved by maintaining
   a separate repository for built products.)

In all cases, there is a related question of which build system
to use for asset generation/management and compilation/minification/etc.

1. [`webpack`](https://webpack.github.io/)
   is well-suited in principle, as it is specifically
   designed for modules with non-JS dependencies. However,
   there may be limitations and/or undesired behavior here
   (for instance, CSS dependencies get in-lined as style tags,
   removing our ability to control ordering) so it may
2. `gulp` or `grunt`. Commonplace, but both still require
   non-trivial coding and/or configuration in order to produce
   appropriate build artifacts.
3. [Just `npm`](http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/).
   Reduces the amount of tooling being used, but may introduce
   some complexity (e.g. custom scripts) to the build process,
   and may reduce portability.

## Step 3. Separate repositories

Refactor existing applications built on Open MCT Web such that they
are no longer forks, but instead separate projects with a dependency
on the built artifacts from Step 2.

## Step 4. Design registration API

Design the registration API that will replace declarative extension
categories and extensions (including Angular built-ins and composite
services.)

This may occur in parallel with implementation steps.

It will be necessary
to have a decision about the role of Angular at this point; are extensions
registered via provider configuration (Angular), or directly in some
exposed registry?

Success criteria here should be based on peer review. Scope of peer
review should be based on perceived risk/uncertainty surrounding
proposed changes, to avoid waste; may wish to limit this review to
the internal team. (The extent to which external
feedback is available is limited, but there is an inherent timeliness
to external review; need to balance this.)

Benefits:

* Solves the "general case" early, allowing for early validation.

Note that in specific cases, it may be desirable to refactor some
current "extension category" in a manner that will not appear as
registries, _or_ to locate these in different
namespaces, _or_ to remove/replace certain categories entirely.
This work is deferred intentionally to allow for a solution of the
general case.

## Step 5. Imperative extension registration

Register individual extensions imperatively, implementing API changes
from the previous step. At this stage, _usage_ of the API may be confined
to a transitional adapter in the framework layer

An important sub-task here will be to discover and define dependencies
among bundles. Composite services and extension categories are presently
"implicit"; after the API redesign, these will become "explicit", insofar
as some specific component will be responsible for creating any registries.
As such, "bundles" which _use_ specific registries will need to have an
enforceable dependency (e.g. require) upon those "bundles" which
_declare_ those registries.
