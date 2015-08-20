# Overview

The purpose of this document is to review feedback on Open MCT Web's
current API and propose improvements to the API, particularly for a
1.0.0 release.

Strategically, this is handled by:

* Identifying broader goals.
* Documenting feedback and related background information.
* Reviewing feedback to identify trends and useful features.
  * In particular, pull out "pain points" to attempt to address,
    as well as positive attributes to attempt to preserve.
* Proposing a set of API changes to address these "pain points."
  * This also takes into account scheduling concerns.
* Once agreed-upon, formalize this set of changes (e.g. as UML
  diagrams) and plan to implement them.

# Goals

## Characteristics of a good API

A good API:

* Is easy to understand.
* Rewards doing things "the right way."
* Saves development effort.
* Is powerful enough to support a broad range of applications.
* Lends itself to good documentation.

These characteristics can sometimes be at odds with each other, or
with other concerns. These should typically be viewed as participants
in trades.

## Evaluating APIs

APIs may be evaluated based on:

* Number of interfaces.
  * How many application-specific interfaces do I need to know to
    solve a certain class of problems?
* Size of interfaces.
  * How many methods does each interface have?
* Depth of interfaces.
  * Specifically, how many methods do I need to call before the return
    value is of a form that is not specific to the API?
* Clarity of interfaces.
  * How much documentation or learning is required before an interface is
    useful?
* Consistency of interfaces.
  * How similar is one interface to an analogous interface?
* Utility of interfaces.
  * How much development effort is reduced by utilizing these interfaces,
    versus accomplishing the same goals with other tools?
* Power of interfaces.
  * How much application functionality can I influence with the interfaces
    that are available to me?

In general, prefer to have a small number of simple, shallow, clear,
useful, powerful interfaces.

# Developer Feedback

## Developer Intern Feedback

This feedback comes from interns who worked closely with
Open MCT Web as their primary task over the Summer of 2015.

### Developer Intern 1

Worked on bug fixes in the platform and a plugin for search.

* Initially, it was confusing that many things in files that are in
  very different locations in the code base refer to each other.
  * Perhaps explain more the organization strategy behind the
    different main sections, like "commonUI" vs "core".
* This may be just me, but there are often long chains of related
  functions calling each other, and when I had to modify the behavior,
  I had a hard time remembering to look for the highest level function
  in the call chain to change. I also sometimes had a hard time finding
  the connections between the functions. But, that is important because
  the implementation of the functions along the chain may change later.
* One very helpful thing that you could add might just be documentation
  that is not in paragraph format like in the current developer guide.
  I would just like a list of all the functions and members of each kind
  of object there is, and descriptions of what they are and how they're
  used.
  * Also, the current developer guide pdf's words that are in 'code font',
   rather than the normal text, are not searchable.
   (Depending on the pdf viewer.)
* I do appreciate that there is some example code.
* I am still slightly confused about what "domainObject" refers to in
  different situations.
* The tutorials are helpful, but only really for designing new views.
  It doesn't help much with gaining understanding of how the other parts
  of the application work.
* The general idea of 'telemetry' in this context is kind of confusing.
  It is hard to figure out what the difference between the various ways of
  dealing with telemetry are. e.g., what is the difference between just
  "Telemetry" and the "Telemetry Service"? There are many
  "Telemetry Thing"s which seem related, but in an unclear way.

### Developer Intern 2

Worked on platform bug fixes and mobile support.

* No guide for the UI and front end for the HTML/CSS part of Open MCT Web.
  Not sure if this is applicable or needed for developers, however would
  be helpful to any front end development
* Found it difficult to follow the plot controller & subplot
  functions/features, such as zooming.
* If the developer guide could have for references to which files or
  functions are key for gestures, browse navigation, etc it would be
  helpful for future developers as a place to start looking. I found
  it occasionally difficult to find which files or functions I wanted
  at first.

## Plugin Developer Feedback

This feedback comes from developers who have worked on plugins for
Open MCT Web, but have not worked on the platform.

### Plugin Developer 1

Used Open MCT Web over the course of several months (on a
less-than-half-time basis) to develop a
spectrum visualization plugin.

* Not a lot of time to work on this, made it hard to get up the learning
  curve.
  * Note that this is the norm, particularly for GDS development.
* JavaScript carries its own learning curve.
* The fact that it pulls in other tools whose APIs need to be learned
  also makes the learning curve harder to get up.
* Tracking down interconnected parts was a bit difficult.
* Could really use examples.
* Easy to get lost when not immersed in the style.

### Plugin Developer 2

Used Open MCT Web over the course of several weeks (on a half-time basis)
to develop a tabular visualization plugin.

* Pain points
   * Unable to copy and paste from tutorial pdfs into code
      * Wanted to verify my environment was setup properly so that I
        could get the final product working in the end without having
        to type everything out.  Perhaps there could be something in
        github that has the final completed tutorial for new users to
        checkout?  Or a step by step one kind of like the tutorials on
        the angular js webpage?
   * Typing too long without seeing results of what I was doing
      * At some points in the tutorial I ended up typing for the sake
        of typing without knowing what I was really typing for.
      * If there were break points where we could run the incomplete
        code and just see a variable dump or something even that would
        be helpful to know that I am on the right track.
   * Documentation on features are a bit hard to find.
      * I'm not sure what I can do until I search through examples of
        existing code and work my way backwards.
      * Maybe you can link the features we are using in the tutorial to
        their respective parts in the developer guide?  Not sure if that
        can be done on PDFs, so maybe a webpage instead?
* Positive Attributes
   * Unable to copy and paste from tutorial pdfs into code
      * I know I also listed this as a pain, but it was kind of helpful
        being forced to read and type everything out.
   * "Widgets" are self contained in their own directories.  I don't have
      to be afraid of exploding things.
   * All files/config that I care about for a "widget" can be found in
     the bundles.json
* Misc
   * Coming from a not so strong webdev background and on top of that a
     zero strong angular background I think starting off with a simple
     "Hello World" webpage tutorial would have been nice.
      * Start off with a bare bones bundle json with an empty controller
        and static "Hello World" in the view
      * Add the variable "Hello World" into the controller for the view
        to display
      * Add a model property to the bundle.json to take in "Hello World"
        as a parameter and pass through to the controller/view

## Misc. Feedback (mostly verbal)

* Easy to add things.
* Separation of concerns is unclear (particularly: "where's the MVC?")
* Telemetry API is confusing. In particular, `TelemetrySeries` should
  just be an array.
  * Came out of design discussions for Limits.
* Capabilities are confusing.

## Long-term Developer Notes

The following notes are from original platform developer, with long
term experience using Open MCT Web.

* Bundle mechanism allows for grouping related components across concerns,
  and adding and removing these easily. (e.g. model and view components of
  Edit mode are all grouped together in the Edit bundle.)

## AngularJS

Angular 2.0.0 is coming (maybe by end of 2015.)

It will not be backwards-compatible with Angular 1.x.
The differences are significant enough that switching to
Angular 2 will require only slightly less effort than switching
to an entirely different framework.

We can expect AngularJS 1.x to reach end-of-life reasonably soon thereafter.

Our API is currently a superset of Angular's API, so this directly effects
our API. Specifically, API changes should be oriented towards removing
or reducing the Angular dependency.

### Angular's Role

Angular is Open MCT Web's:

* Dependency injection framework.
* Template rendering.
* DOM interactions.
* Services library.
* Form validator.
* Routing.

This is the problem with frameworks: They become a single point of
failure for unrelated concerns.

### Rationale for Adopting Angular

The rationale for adopting AngularJS as a framework is
documented in https://trunk.arc.nasa.gov/jira/browse/WTD-208.
Summary of the expected benefits:

* Establishes design patterns that are well-documented and
  understood in industry. This can be beneficial in training
  new staff, and lowers the documentation burden on the local
  development team. If MCT-Web were to stay with its current
  architecture, significant developer-oriented documentation
  and training materials would need to be produced.
* The maintainability of MCT-Web would be enhanced by using a
  framework like Angular. The local team would enjoy the benefits of
  maintenance performed by the sponsor, but would not incur any cost
  for this. This would include future upgrades, testing, and bug fixes.
* Replaces DOM-manipulation with a declarative data-binding syntax
  which automatically updates views when the model data changes. This
  pattern has the potential to save the development team from
  time-consuming and difficult-to-debug DOM manipulation.
* Provides data binding to backend models.
* Provides patterns for form validation.
* Establishes documented patterns for add-on modules and services.
* Supports unit tests and system tests (tests which simulate user
  interactions in the browser)
* Angular software releases can be expected to be tested, which would
  allow MCT-Web developers to focus on MCT-specific features, instead
  of the maintenance of custom infrastructure.

### Actual Experience with Angular

Most of the expected benefits of Angular have been invalidated
by experience:

* Feedback from new developers is that Angular was a hindrance to
  training, not a benefit. ("One more thing to learn.") Significant
  documentation remains necessary for Open MCT Web.
* Expected enhancements to maintainability will be effectively
  invalidated by an expected Angular end-of-life.
* Data binding and automatic view updates do save development effort,
  but also carry a performance penalty. This can be solved, but requires
  resorting to exactly the sort of DOM manipulations we want to avoid.
  In some cases this can require more total development (writing a
  poorly-performing Angular version, then "optimizing" by rewriting a
  non-Angular version.)
* Expected reduction of test scope will also be invalidated by an
  expected end-of-life.

Other problems:

* Hinders integrating non-Angular components. (Need to wrap with
  Angular API, e.g. as directives, which may be non-trivial.)
* Interferes with debugging by swallowing or obscuring exceptions.

# Feedback Review

## Problem Summary

The following attributes of the current API are undesirable:

- [ ] It is difficult to tell "where things are" in the code base.
- [ ] It is difficult to see how objects are passed around at run-time.
- [ ] It is difficult to trace flow of control generally.
- [ ] Multiple interfaces for related concepts (e.g. telemetry) is confusing.
- [ ] API documentation is missing or not well-formatted for use.
- [ ] High-level separation of concerns is not made clear.
- [ ] Interface depth of telemetry API is excessive (esp. `TelemetrySeries`)
- [ ] Capabilities as a concept lack clarity.
- [ ] Too many interfaces and concepts to learn.
- [ ] Exposing third-party APIs (e.g. Angular's) increases the learning curve.
- [ ] Want more examples, easier-to-use documentation.
- [ ] UI-relevant features (HTML, CSS) under-documented
- [ ] Good MVC for views of domain objects not enforced (e.g. plots)

## Positive Features

It is desirable to retain the following features in an API redesign:

- [ ] Creating new features and implementing them additively is well-supported.
- [ ] Easy to add/remove features which involve multiple concerns.
- [ ] Features can be self-contained.
- [ ] Declarative syntax makes it easy to tell what's in use.

## Requirements

The following are considered "must-haves" of any complete API
redesign:

- [ ] Don't require usage of Angular API.
- [ ] Don't require support for Angular API.

# Proposals

## RequireJS as dependency injector

Use Require.JS for dependency injection.

Dependencies will then be responsible for being sufficiently
mutable/extensible/customizable. This can be facilitated by
adding platform classes which can facilitate the addition
of reusable components.

Things that we usefully acquire via dependency injection currently:

* Services.
* Extensions (by category).
* Configuration constants.

Services would be defined (by whatever component is responsible
for declaring it) using `define` and the explicit name of the
service. To allow for the power of composite services, the
platform would provide a `CompositeService` class that supports
this process by providing `register`, `decorate`, and `composite`
methods to register providers, decorators, and aggregators
respectively. (Note that nomenclature changes are also implied
here, to map more clearly to the Composite Pattern and to
avoid the use of the word "provider", which has ambiguity with
Angular.)

```js
define(
  "typeService",
  ["CompositeService"],
  function (CompositeService) {
    var typeService = new CompositeService([
      "listTypes",
      "getType"
    ]);

    // typeService has `listTypes` and `getType` as methods;
    // at this point they are stubbed (will return undefined
    // or throw or similar) but this will change as
    // decorators/compositors/providers are added.

    // You could build in a compositor here, or
    // someone could also define one later
    typeService.composite(function (typeServices) {
      // ... return a TypeService
    });

    // Similarly, you could register a default implementation
    // here, or from some other script.
    typeService.register(function (typeService) {
      // ... return a TypeService
    }, { priority: 'default' });

    return typeService;
  }
);
```

Other code could then register additional `TypeService`
implementations (or decorators, or even compositors) by
requiring `typeService` and calling those methods; or, it
could use `typeService` directly. Priority ordering could
be utilized by adding a second "options" argument.

For extension categories, you could simply use registries:

```js
define(
  "typeRegistry",
  ["ExtensionRegistry"],
  function (ExtensionRegistry) {
    return new ExtensionRegistry();
  }
);
```

Where `ExtensionRegistry` extends `Array`, and adds a
`register` method which inserts into the array at some
appropriate point (e.g. with an options parameter that
respects priority order.)

This makes unit testing somewhat more difficult when you
want to mock injected dependencies; there are tools out
there (e.g. [Squire](https://github.com/iammerrick/Squire.js/))
which can help with this, however.

### Benefits

* Clarifies "how objects are passed around at run-time";
  answer is always "via RequireJS."
* Preserves flexibility/power provided by composite services.
* Lends itself fairly naturally to API documentation via JSDoc
  (as compared to declaring things in bundles, which does not.)
* Reduces interface complexity for acquiring dependencies;
  one interface for both explicit and "implicit" dependencies,
  instead of separate approaches for static and substitutable
  dependencies.
* Removes need to understand Angular's DI mechanism.
* Improves useability of documentation (`typeService` is an
  instance of `CompositeService` and implements `TypeService`
  so you can easily traverse links in the JSDoc.)

### Detriments

* Having services which both implement the service, and
  have methods for registering the service, is a little
  weird; would be cleaner if these were separate.
  (Mixes concerns.)
* Syntax becomes non-declarative, which may make it harder to
  understand "what uses what."
* Allows for ordering problems (e.g. you start using a
  service before everything has been registered.)

## Arbitrary HTML Views

Currently, writing new views requires writing Angular templates.
This must change if we want to reduce our dependence on Angular.

Instead, propose that:

* What are currently called "views" we call something different.
  (Want the term view to be more like "view" in the MVC sense.)
  * For example, call them "applications."
* Consolidate what are currently called "representations" and
  "templates", and instead have them be "views".

For parity with actions, a `View` would be a constructor which
takes an `ActionContext` as a parameter (with similarly-defined
properties) and exposes a method to retrieve the HTML elements
associateed with it.

The platform would then additionally expose an `AngularView`
implementation to improve compatibility with existing
representations, whose usage would something like:

```js
define(
  ["AngularView"],
  function (AngularView) {
    var template = "<span ng-click='...'>Hello world</span>";
    return new AngularView(template);
  }
);
```

The interface exposed by a view is TBD, but should provide at
least the following:

* A way to get the HTML elements that are exposed by & managed
  by the view.
* A `destroy` method to detach any listeners at the model level.

Individual views are responsible for managing their resources,
e.g. listening to domain objects for mutation. To keep DRY, the
platform should include one or more view implementations that
can be used/subclassed which handle common behavior(s).

### Benefits

* Using Angular API for views is no longer required.
* Views become less-coupled to domain objects. Domain objects
  may be present in the `ViewContext`, but this also might
  just be a "view" of some totally different thing.
* Helps clarify high-level concerns in the API (a View is now
  really more like a View in the MVC sense; although, not
  completely, so this gets double-booked as a detriment.)
* Having a `ViewContext` that gets passed in allows views to
  be more "contextually aware," which is something that has
  been flagged previously as a UX desire.

### Detriments

* Becomes less clear how views relate to domain objects.
* Adds another interface.
* Leaves an open problem of how to distinguish views that
  a user can choose (Plot, Scrolling List) from views that
  are used more internally by the application (tree view.)
* Views are still not Views in the MVC sense (in practice,
  the will likely be view-controller pairs.) We could call
  them widgets to disambiguate this.
* Related to the above, even if we called these "widgets"
  it would still fail to enforce good MVC.

## Wrap Angular Services

Wrap Angular's services in a custom interfaces; e.g.
replace `$http` with an `httpService` which exposes a useful
subset of `$http`'s functionality.

### Benefits

* Removes a ubiquitous dependency on Angular.
* Allows documentation for these features to be co-located
  and consistent with other documentation.
* Facilitates replacing these with non-Angular versions
  in the future.

### Detriments

* Increases the number of interfaces in Open MCT Web. (Arguably,
  not really, since the same interfaces would exist if exposed
  by Angular.)

## Bundle Declarations in JavaScript

Replace `bundle.json` files (and bundle syntax generally) with
an imperative form. There would instead be a `Bundle` interface
which scripts can implement (perhaps assisted by a platform
class.)

The `bundles.json` file would then be replaced with a `bundles.js`
or `Bundles.js` that would look something like:

```js
define(
  [
    'platform/core/PlatformBundle',
    // ... etc ...
    'platform/features/plot/PlotBundle'
  ],
  function () {
    return arguments;
  }
);
```

Which could in turn be used by an initializer:

```js
define(
  ['./bundles', 'mct'],
  function (bundles, mct) {
    mct.initialize(bundles);
  }
);
```

A `Bundle` would have a constructor that took some JSON object
(a `BundleContext`, lets say) and would provide methods for
application life-cycle events. Depending on other choices,
a dependency injector could be passed in at some appropriate
life-cycle call (e.g. initialize.)

This would also allow for "composite bundles" which serve as
proxies for multiple bundles. The `BundleContext` could contain
(or later be amended to contain) filtering rules to ignore
other bundles and so forth (this has been useful for administering
Open MCT Web in subtly different configurations in the past.)

### Benefits

* Imperative; more explicit, less magic, more clear what is going on.
* Having a hierarchy of "bundles" could make it easier to navigate
  (relevant groupings can be nested in a manner which is not
  currently well-supported.)
* Lends itself naturally to a compilation step.
* Nudges plugin authors to "do your initialization and registration
  in a specific place" instead of mixing in registration of features
  with their implementations.

### Detriments

* Introduces another interface.
* Loses some of the convenience of having a declarative
  summary of components and their dependencies.

## Pass around a dependency injector

:warning: Note that this is incompatible with the
[RequireJS as dependency injector](#requirejs-as-dependency-injector)
proposal.

Via some means (such as in a registration lifecycle event as
described above) pass a dependency injector to plugins to allow
for dependencies to be registered.

For example:

```js
MyBundle.prototype.registration = function (architecture) {
  architecture.service('typeService').register(MyTypeService);
  architecture.extension('actions').register(
    [ 'foo' ],
    function (foo) { return new MyAction(foo); }
  );
};
```

### Benefits

* Ensures that registration occurs at an appropriate stage of
  application execution, avoiding start-up problems.
* Makes registration explicit (generally easier to understand)
  rather than implicit.
* Encapsulates dependency injection nicely.

### Detriments

* Increases number of interfaces to learn.
* Syntax likely to be awkward, since in many cases we really
  want to be registering constructors.

## Remove partial constructors

Remove partial constructors; these are confusing. It is hard to
recognize which constructor arguments are from dependencies, and
which will be provided at run-time. Instead, it is the responsibility
of whoever is introducing a component to manage these things
separately.

### Benefits

* More clarity.

### Detriments

* Possibly results in redundant effort to manage this difference
  (other APIs may need to be adjusted accordingly.)

## Rename Views to Applications

Rename (internally to the application, not necessarily in UI or
in user guide) what are currently called `views` to `applications`.

### Benefits

* Easier to understand. What is currently called a "view" is,
  in the MVC sense, a view-controller pair, usually with its own
  internal model for view state. Calling these "applications"
  would avoid this ambiguity/inconsistency.
* Also provides an appropriate mindset for building these;
  particularly, sets the expectation that you'll want to decompose
  this "application" into smaller pieces. This nudges developers
  in appropriate directions (in contrast to `views`, which
  typically get implemented as templates with over-complicated
  "controllers".)

### Detriments

* Developer terminology falls out of sync with what is used in
  the user guide.

## Provide Classes for Extensions

As a general pattern, when introducing extension categories, provide
classes with a standard implementation of these interfaces that
plugin developers can `new` and register.

For example, instead of declaring a type as:

```json
{
  "types": [{
    "key": "sometype",
    "glyph": "X",
    "etc": "..."
  }]
}
```

You would register one as:

```js
// Assume we have gotten a reference to a type registry somehow
typeRegistry.register(new Type({
    "key": "sometype",
    "glyph": "X",
    "etc": "..."
}));
```

### Benefits

* Easier to understand (less "magic").
* Lends itself naturally to substitution of different implementations
  of the same interface.
* Allows for run-time decisions about exactly what gets registered.

### Detriments

* Adds some modest boilerplate.
* Provides more opportunity to "do it wrong."

## Normalize naming conventions

Adopt and obey the following naming conventions for AMD modules
(and for injectable dependencies, which may end up being modules):

* Use `UpperCamelCase` for classes.
* Use `lowerCase` names for instances.
    * Use `someNoun` for object instances which implement some
      interface. The noun should match the implemented interface,
      when applicable.
    * `useSomeVerb` for functions.
* Use `ALL_CAPS_WITH_UNDERSCORES` for other values, including
  "struct-like" objects (that is, where the object conceptually
  contains properties rather than methods.)

### Benefits

* Once familiar with the conventions, easier to understand what
  individual modules are.

### Detriments

* A little bit inflexible.

## Expose no third-party APIs

As a general practice, expose no third-party APIs as part of the
platform.

For cases where you do want to access third-party APIs directly
from other scripts, this behavior should be "opt-in" instead of
mandatory. For instance, to allow addition of Angular templates,
an Angular-support bundle could be included which provides an
`AngularView` class, a `controllerRegistry`, et cetera. Importantly,
such a bundle would need to be kept separate from the platform API,
or appropriately marked as non-platform in the API docs (an
`@experimental` tag would be nice here if we feel like extending
JSDoc.)

### Benefits

* Simplifies learning curve (only one API to learn.)
* Reduces Angular dependency.
* Avoids the problems of ubiquitous dependencies generally.

### Detriments

* Increases documentation burden.

## Register Extensions as Instances instead of Constructors

Register extensions as object instances instead of constructors.
This allows for API flexibility w.r.t. constructor signatures
(and avoids the need for partial constructors) and additionally
makes it easier to provide platform implementations of extensions
that can be used, subclassed, etc.

For instance, instead of taking an `ActionContext` in its
constructor, an `Action` would be instantiated once and would
accept appropriate arguments to its methods:

```js
function SomeAction {
}
SomeAction.prototype.canHandle = function (actionContext) {
    // Check if we can handle this context
};
SomeAction.prototype.perform = function (actionContext) {
    // Perform this action, in this context
};
```

### Benefits

* Reduces scope of interfaces to understand (don't need to know
  what constructor signature to provide for compatibility.)

### Detriments

* Requires refactoring of various types; may result in some
  awkward APIs or extra factory interfaces.

## Remove capability delegation

The `delegation` capability has only been useful for the
`telemetry` capability, but using both together creates
some complexity to manage. In practice, these means that
telemetry views need to go through `telemetryHandler` to
get their telemetry, which in turn has an awkward API.

This could be resolved by:

* Removing `delegation` as a capability altogether.
* Reworking `telemetry` capability API to account for
  the possibility of multiple telemetry-providing
  domain objects. (Perhaps just stick `domainObject`
  in as a field in each property of `TelemetryMetadata`?)
* Move the behavior currently found in `telemetryHandler`
  into the `telemetry` capability itself (either the
  generic version, or a version specific to telemetry
  panels - probably want some distinct functionality
  for each.)

### Benefits

* Reduces number of interfaces.
* Accounting for the possibility of multiple telemetry objects
  in the `telemetry` capability API means that views using
  this will be more immediately aware of this as a possibility.

### Detriments

* Increases complexity of `telemetry` capability's interface
  (although this could probably be minimized.)
