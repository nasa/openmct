# API Refactoring

This document summarizes a path toward implementing API changes
from the [API Redesign](../proposals/APIRedesign.md) for Open MCT
v1.0.0.

# Goals

These plans are intended to minimize:

* Waste; avoid allocating effort to temporary changes.
* Downtime; avoid making changes in large increments that blocks
  delivery of new features for substantial periods of time.
* Risk; ensure that changes can be validated quickly, avoid putting
  large effort into changes that have not been validated.

# Plan

```nomnoml
#comment: This diagram is in nomnoml syntax and should be rendered.
#comment: See https://github.com/nasa/openmctweb/issues/264#issuecomment-167166471


[<start> Start]->[<state> Imperative bundle registration]

[<state> Imperative bundle registration]->[<state> Build and packaging]
[<state> Imperative bundle registration]->[<state> Refactor API]

[<state> Build and packaging |
    [<start> Start]->[<state> Incorporate a build step]
    [<state> Incorporate a build step |
        [<start> Start]->[<state> Choose package manager]
        [<start> Start]->[<state> Choose build system]
        [<state> Choose build system]<->[<state> Choose package manager]
        [<state> Choose package manager]->[<state> Implement]
        [<state> Choose build system]->[<state> Implement]
        [<state> Implement]->[<end> End]
    ]->[<state> Separate repositories]
    [<state> Separate repositories]->[<end> End]
]->[<state> Release candidacy]


[<start> Start]->[<state> Design registration API]

[<state> Design registration API |
     [<start> Start]->[<state> Decide on role of Angular]
     [<state> Decide on role of Angular]->[<state> Design API]
     [<state> Design API]->[<choice> Passes review?]
     [<choice> Passes review?] no ->[<state> Design API]
     [<choice> Passes review?]-> yes [<end> End]
]->[<state> Refactor API]

[<state> Refactor API |
    [<start> Start]->[<state> Imperative extension registration]
    [<state> Imperative extension registration]->[<state> Refactor individual extensions]

    [<state> Refactor individual extensions |
        [<start> Start]->[<state> Prioritize]
        [<state> Prioritize]->[<choice> Sufficient value added?]
        [<choice> Sufficient value added?] no ->[<end> End]
        [<choice> Sufficient value added?] yes ->[<state> Design]
        [<state> Design]->[<choice> Passes review?]
        [<choice> Passes review?] no ->[<state> Design]
        [<choice> Passes review?]-> yes [<state> Implement]
        [<state> Implement]->[<end> End]
    ]->[<state> Remove legacy bundle support]

    [<state> Remove legacy bundle support]->[<end> End]
]->[<state> Release candidacy]

[<state> Release candidacy |
    [<start> Start]->[<state> Verify |
        [<start> Start]->[<choice> API well-documented?]
        [<start> Start]->[<choice> API well-tested?]
        [<choice> API well-documented?]-> no [<state> Write documentation]
        [<choice> API well-documented?] yes ->[<end> End]
        [<state> Write documentation]->[<choice> API well-documented?]
        [<choice> API well-tested?]-> no [<state> Write test cases]
        [<choice> API well-tested?]-> yes [<end> End]
        [<state> Write test cases]->[<choice> API well-tested?]
    ]
    [<start> Start]->[<state> Validate |
        [<start> Start]->[<choice> Passes review?]
        [<start> Start]->[<state> Use internally]
        [<state> Use internally]->[<choice> Proves useful?]
        [<choice> Passes review?]-> no [<state> Address feedback]
        [<state> Address feedback]->[<choice> Passes review?]
        [<choice> Passes review?] yes -> [<end> End]
        [<choice> Proves useful?] yes -> [<end> End]
        [<choice> Proves useful?] no -> [<state> Fix problems]
        [<state> Fix problems]->[<state> Use internally]
    ]
    [<state> Validate]->[<end> End]
    [<state> Verify]->[<end> End]
]->[<state> Release]

[<state> Release]->[<end> End]
```

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
existing bundle registration mechanisms. The main point of entry
would need to be adapted to clearly depend on these bundles
(in the require sense of a dependency), and the framework layer
would need to implement and integrate with this transitional
API.

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
  which might require us to go dark. (Mitigates
  ["greenfield paradox"](http://stepaheadsoftware.blogspot.com/2012/09/greenfield-or-refactor-legacy-code-base.html);
  want to add value with new API but don't want to discard value
  of tested/proven legacy codebase.)

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

* Compile (and, preferably, optimize/minify) Open MCT
  sources into a single `.js` file.
  * It is desirable to do the same for HTML sources, but
    may wish to defer this until a subsequent refactoring
    step if appropriate.
* Provide non-code assets in a format that can be reused by
  derivative projects in a straightforward fashion.

Should also consider which dependency/packaging manager should
be used by dependent projects to obtain Open MCT. Approaches
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

Refactor existing applications built on Open MCT such that they
are no longer forks, but instead separate projects with a dependency
on the built artifacts from Step 2.

Note that this is achievable already using `bower` (see `warp-bower`
branch at http://developer.nasa.gov/mct/warp for an example.)
However, changes involved in switching to an imperative API and
introducing a build process may change (and should simplify) the
approach used to utilize Open MCT as a dependency, so these
changes should be introduced first.

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
to a transitional adapter in the framework layer; bundles may continue
to utilize the transitional API for registering extensions in the
legacy format.

An important, ongoing sub-task here will be to discover and define dependencies
among bundles. Composite services and extension categories are presently
"implicit"; after the API redesign, these will become "explicit", insofar
as some specific component will be responsible for creating any registries.
As such, "bundles" which _use_ specific registries will need to have an
enforceable dependency (e.g. require) upon those "bundles" which
_declare_ those registries.

## Step 6. Refactor individual extensions

Refactor individual extension categories and/or services that have
been identified as needing changes. This includes, but is not
necessarily limited to:

* Views/Representations/Templates (refactored into "components.")
* Capabilities (refactored into "roles", potentially.)
* Telemetry (from `TelemetrySeries` to `TelemetryService`.)

Changes should be made one category at a time (either serially
or separately in parallel) and should involve a tight cycle of:

1. Prioritization/reprioritization; highest-value API improvements
   should be done first.
2. Design.
3. Review. Refactoring individual extensions will require significant
   effort (likely the most significant effort in the process) so changes
   should be validated early to minimize risk/waste.
4. Implementation. These changes will not have a one-to-one relationship
   with existing extensions, so changes cannot be centralized; usages
   will need to be updated across all "bundles" instead of centralized
   in a legacy adapter. If changes are of sufficient complexity, some
   planning should be done to spread out the changes incrementally.

By necessity, these changes may break functionality in applications
built using Open MCT. On a case-by-case basis, should consider
providing temporary "legacy support" to allow downstream updates
to occur as a separate task; the relevant trade here is between
waste/effort required to maintain legacy support, versus the
downtime which may be introduced by making these changes simultaneously
across several repositories.


## Step 7. Remove legacy bundle support

Update bundles to remove any usages of legacy support for bundles
(including that used by dependent projects.) Then, remove legacy
support from Open MCT.

## Step 8. Release candidacy

Once API changes are complete, Open MCT should enter a release
candidacy cycle. Important things to look at here:

* Are changes really complete?
  * Are they sufficiently documented?
  * Are they sufficiently tested?
* Are changes really sufficient?
  * Do reviewers think they are usable?
  * Does the development team find them useful in practice? This
    will require calendar time to ascertain; should allocate time
    for this, particularly in alignment with the sprint/release
    cycle.
  * Has learning curve been measurably decreased? Comparing a to-do
    list tutorial to [other examples(http://todomvc.com/) could
    provide an empirical basis to this. How much code is required?
    How much explanation is required? How many dependencies must
    be installed before initial setup?
  * Does the API offer sufficient power to implement the extensions we
    anticipate?
  * Any open API-related issues which should block a 1.0.0 release?

Any problems identified during release candidacy will require
subsequent design changes and planning.

## Step 9. Release

Once API changes have been verified and validated, proceed
with release, including:

* Tagging as version 1.0.0 (at an appropriate time in the
  sprint/release cycle.)
* Close any open issues which have been resolved (or made obsolete)
  by API changes.