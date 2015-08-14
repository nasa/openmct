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

## Plugin Developer Feedback

This feedback comes from developers who have worked on plugins for
Open MCT Web, but have not worked on the platform.

* Not a lot of time to work on this, made it hard to get up the learning
  curve.
  * Note that this is the norm, particularly for GDS development.

## Misc. Feedback (mostly verbal)

* Easy to add things.
* Separation of concerns is unclear (particularly: "where's the MVC?")
* Telemetry API is confusing. In particular, `TelemetrySeries` should
  just be an array.
  * Came out of design discussions for Limits.
* Capabilities are confusing.

## Victor's Notes

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

## Actual Experience with Angular

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
- [ ] Multiple interfaces for related concepts (e.g. telemetry) is confusing.
- [ ] API documentation is missing or not well-formatted for use.
- [ ] High-level separation of concerns is not made clear.
- [ ] Interface depth of telemetry API is excessive (esp. `TelemetrySeries`)
- [ ] Capabilities as a concept lack clarity.
- [ ] Too many interfaces and concepts to learn.

## Positive Features

It is desirable to retain the following features in an API redesign:

- [ ] Creating new features and implementing them additively is well-supported.
- [ ] Easy to add/remove features which involve multiple concerns.

## Requirements

The following are considered "must-haves" of any complete API
redesign:

- [ ] Don't require usage of Angular API.
- [ ] Don't require support for Angular API.
