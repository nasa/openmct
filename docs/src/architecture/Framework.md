# Framework Architecture

## Overview

The framework layer's most basic responsibility is allowing individual
software components to communicate. The software components it recognizes
are:

* _Extensions_: Individual units of functionality that can be added to
  or removed from Open MCT Web. _Extension categories_ distinguish what
  type of functionality is being added/removed.
* _Bundles_: A grouping of related extensions
  (named after an analogous concept from [OSGi](http://www.osgi.org/))
  that may be added or removed as a group.

The framework layer operates by taking a set of active bundles, and
exposing extensions to one another as-needed, using
[dependency injection](https://en.wikipedia.org/wiki/Dependency_injection).
Extensions are responsible for declaring their dependencies in a
manner which the framework layer can understand.

```nomnoml
#direction: down
[Open MCT Web|
  [Dependency injection framework]-->[Platform bundle #1]
  [Dependency injection framework]-->[Platform bundle #2]
  [Dependency injection framework]-->[Plugin bundle #1]
  [Dependency injection framework]-->[Plugin bundle #2]
  [Platform bundle #1|[Extensions]]
  [Platform bundle #2|[Extensions]]
  [Plugin bundle #1|[Extensions]]
  [Plugin bundle #2|[Extensions]]
  [Platform bundle #1]<->[Platform bundle #2]
  [Plugin bundle #1]<->[Platform bundle #2]
  [Plugin bundle #1]<->[Plugin bundle #2]
]
```

The "dependency injection framework" in this case is
[AngularJS](https://angularjs.org/). Open MCT Web's framework layer
is really just a thin wrapper over Angular that recognizes the
concepts of bundles and extensions (as declared in JSON files) and
registering extensions with Angular. It additionally acts as a
mediator between Angular and [RequireJS](http://requirejs.org/),
which is used to load JavaScript sources which implement
extensions.

```nomnoml
[Framework layer|
  [AngularJS]<-[Framework Component]
  [RequireJS]<-[Framework Component]
  [Framework Component]1o-*[Bundles]
]
```

It is worth noting that _no other components_ are "aware" of the
framework component directly; Angular and Require are _used by_ the
framework components, and extensions in various bundles will have
their dependencies satisfied by Angular as a consequence of registration
activities which were performed by the framework component.


## Application Initialization

The framework component initializes an Open MCT Web application following
a simple sequence of steps.

```nomnoml
[<start> Start]->[<state> Load bundles.json]
[Load bundles.json]->[<state> Load bundle.json files]
[Load bundle.json files]->[<state> Resolve implementations]
[Resolve implementations]->[<state> Register with Angular]
[Register with Angular]->[<state> Bootstrap application]
[Bootstrap application]->[<end> End]
```

## Architectural Paradigm

Open MCT Web's architecture relies on a simple premise: Individual units
(extensions) only have access to the dependencies they declare that they
need, and they acquire references to these dependencies via dependency
injection. This has several desirable traits:

* Programming to an interface is enforced. Any given dependency can be
  swapped out for something which exposes an equivalent interface. This
  improves flexibility against refactoring, simplifies testing, and
  provides a common mechanism for extension and reconfiguration.
* The dependencies of a unit must be explicitly defined. This means that
  it can be easily determined what a given unit's role is within the
  larger system, in terms of what other components it will interact with.
  It also helps to enforce good separation of concerns: When a set of
  declared dependencies becomes long it is obvious, and this is usually
  a sign that a given unit is involved in too many concerns and should
  be refactored into smaller pieces.
* Individual units do not need to be aware of the framework; they need
  only be aware of the interfaces to the components they specifically
  use. This avoids introducing a ubiquitous dependency upon the framework
  layer itself; it is plausible to modify or replace the framework
  without making changes to individual software components which run upon
  the framework.

A drawback to this approach is that it makes it difficult to define
"the architecture" of Open MCT Web, in terms of describing the specific
units that interact at run-time. The run-time architecture is determined
by the framework as the consequence of wiring together dependencies.
As such, the specific architecture of any given application built on
Open MCT Web can look very different.

The specific service infrastructure provided by the platform is described
in the [Platform Architecture](Platform.md).
