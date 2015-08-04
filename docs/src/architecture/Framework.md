#Overview

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
