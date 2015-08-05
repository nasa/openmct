# Overview

The Open MCT Web platform utilizes the [framework layer](Framework.md)
to provide an extensible baseline for applications which includes:

* A common user interface (and user interface paradigm) for dealing with
  domain objects of various sorts.
* A variety of extension points for introducing new functionality
  of various kinds within the context of the common user interface.
* A service infrastructure to support building additional components.

## Platform Architecture

While the framework provides a more general architectural paradigm for
building application, the platform adds more specificity by defining
additional extension types and allowing for integration with back end
components.

The run-time architecture of an Open MCT Web application can be categorized
into certain high-level tiers:

```nomnoml
[Templates]->[<state> AngularJS]
[AngularJS]->[Presentation Layer]
[Presentation Layer]->[Information Model]
[Presentation Layer]->[Service Infrastructure]
[Information Model]->[Service Infrastructure]
[Service Infrastructure]->[<state> Browser APIs]
[Browser APIs]->[Back-end]
```

Applications built using Open MCT Web may add or configure functionality
in any of these tiers.

# Presentation Layer

The presentation layer of Open MCT Web is responsible for providing
information to display within templates, and for handling interactions
which are initiated from templated DOM elements. AngularJS acts as
an intermediary between the web page as the user sees it, and the
presentation layer implemented as Open MCT Web extensions.

```nomnoml
[Presentation Layer|
  [Angular built-ins|
    [routes]
    [controllers]
    [directives]
  ]
  [Domain object representation|
    [views]
    [representations]
    [representers]
    [gestures]
  ]
]
```


# Information Model

```nomnoml
#direction: right
[Information Model|
  [DomainObject|
    getId() : string
    getModel() : object
    getCapability(key : string) : Capability
    hasCapability(key : string) : boolean
    useCapability(key : string, args...) : *
  ]
  [DomainObject] 1 +- 1 [Model]
  [DomainObject] 1 o- * [Capability]
]
```

Domain objects are the most fundamental component of Open MCT Web's
information model. A domain object is some distinct thing relevant to a
user's work flow, such as a telemetry channel, display, or similar.
Open MCT Web is a tool for viewing, browsing, manipulating, and otherwise
interacting with a graph of domain objects.

A domain object should be conceived of as the union of the following:

* _Identifier_: A machine-readable string that uniquely identifies the
  domain object within this application instance.
* _Model_: The persistent state of the domain object. A domain object's
  model is a JavaScript object that can be losslessly converted to JSON.
* _Capabilities_: Dynamic behavior associated with the domain object.
  Capabilities are JavaScript objects which provide additional methods
  for interacting with the domain objects which expose those capabilities.
  Not all domain objects expose all capabilities. The interface exposed
  by any given capability will depend on its type (as identified
  by the `key` argument.) For instance, a `persistence` capability
  has a different interface from a `telemetry` capability. Using
  capabilities requires some prior knowledge of their interface.

## Capabilities and Services

```nomnoml
#direction: right
[DomainObject]o-[FooCapability]
[FooCapability]o-[FooService]
[FooService]o-[foos]
```

At run-time, the user is primarily concerned with interacting with
domain objects. These interactions are ultimately supported via back-end
services, but to allow customization per-object, these are often mediated
by capabilities.

A common pattern that emerges in the Open MCT Platform is as follows:

* A `DomainObject` has some particular behavior that will be supported
  by a service.
* A `Capability` of that domain object will define that behavior,
  _for that domain object_, supported by a service.
* A `Service` utilized by that capability will perform the actual behavior.
* An extension category will be utilized by that capability to determine
  the set of possible behaviors.

Concrete examples of capabilities which follow this pattern
(or a subset of this pattern) include:

```nomnoml
#direction: right
[DomainObject]1 o- *[Capability]
[Capability]<:--[TypeCapability]
[Capability]<:--[ActionCapability]
[Capability]<:--[PersistenceCapability]
[Capability]<:--[TelemetryCapability]
[TypeCapability]o-[TypeService]
[TypeService]o-[types]
[ActionCapability]o-[ActionService]
[ActionService]o-[actions]
[PersistenceCapability]o-[PersistenceService]
[TelemetryCapability]o-[TelemetryService]
```

# Service Infrastructure

Most services exposed by the Open MCT Web platform follow the
[composite services](Framework.md#composite-services) to permit
a higher degree of flexibility in how a service can be modified
or customized for specific applications.

To simplify usage for plugin developers, the platform also usually
includes a provider implementation for these service type that consumes
some extension category. For instance, an `ActionService` provider is
included which depends upon extension category `actions`, and exposes
all actions declared as such to the system. As such, plugin developers
can simply implement the new actions they wish to be made available without
worrying about the details of composite services or implementing a new
`ActionService` provider; however, the ability to implement a new provider
remains useful when the expressive power of individual extensions is
insufficient.

```nomnoml
[ Service Infrastructure |
  [ObjectService]->[ModelService]
  [ModelService]->[PersistenceService]
  [ObjectService]->[CapabilityService]
  [CapabilityService]->[capabilities]
  [capabilities]->[TelemetryService]
  [capabilities]->[PersistenceService]
  [capabilities]->[TypeService]
  [capabilities]->[ActionService]
  [capabilities]->[ViewService]
  [PersistenceService]->[<database> Document store]
  [TelemetryService]->[<input> Telemetry source]
  [ActionService]->[actions]
  [ActionService]->[PolicyService]
  [ViewService]->[PolicyService]
  [ViewService]->[views]
  [PolicyService]->[policies]
  [TypeService]->[types]
]
```

## Object Service

```nomnoml
#direction: right
[<abstract> ObjectService|
  getObjects(ids : Array.<string>) : Promise.<object.<string, DomainObject>>
]
[DomainObjectProvider]--:>[ObjectService]
[DomainObjectProvider]o-[ModelService]
[DomainObjectProvider]o-[CapabilityService]
```

As domain objects are central to Open MCT Web's information model,
acquiring domain objects is equally important.

```nomnoml
#direction: right
[<start> Start]->[<state> Look up models]
[<state> Look up models]->[<state> Look up capabilities]
[<state> Look up capabilities]->[<state> Instantiate DomainObject]
[<state> Instantiate DomainObject]->[<end> End]
```

Open MCT Web includes an implementation of an `ObjectService` which
satisfies this capability by:

* Consulting the [Model Service](#model-service) to acquire domain object
  models by identifier.
* Passing these models to a [Capability Service](#capability-service) to
  determine which capabilities are applicable.
* Combining these results together as [DomainObject](#information-model)
  instances.

## Model Service

```nomnoml
#direction: down
[<abstract> ModelService|
  getModels(ids : Array.<string>) : Promise.<object.<string, object>>
]
[StaticModelProvider]--:>[ModelService]
[RootModelProvider]--:>[ModelService]
[PersistedModelProvider]--:>[ModelService]
[ModelAggregator]--:>[ModelService]
[CachingModelDecorator]--:>[ModelService]
[MissingModelDecorator]--:>[ModelService]

[MissingModelDecorator]o-[CachingModelDecorator]
[CachingModelDecorator]o-[ModelAggregator]
[ModelAggregator]o-[StaticModelProvider]
[ModelAggregator]o-[RootModelProvider]
[ModelAggregator]o-[PersistedModelProvider]

[PersistedModelProvider]o-[PersistenceService]
[RootModelProvider]o-[roots]
[StaticModelProvider]o-[models]
```

The platform's model service is responsible for providing domain object
models (effectively, JSON documents describing the persistent state
associated with domain objects.) These are retrieved by identifier.

The platform includes multiple components of this variety:

* `PersistedModelProvider` looks up domain object models from
  a persistence store (the [`PersistenceService`](#persistence-service));
  this is how user-created and user-modified
  domain object models are retrieved.
* `RootModelProvider` provides domain object models that have been
  declared via the `roots` extension category. These will appear at the
  top level of the tree hierarchy in the user interface.
* `StaticModelProvider` provides domain object models that have been
  declared via the `models` extension category. This is useful for
  allowing plugins to expose new domain objects declaratively.
* `ModelAggregator` merges together the results from multiple providers.
  If multiple providers return models for the same domain object,
  the most recently modified version (as determined by the `modified`
  property of the model) is chosen.
* `CachingModelDecorator` caches model instances in memory. This
  ensures that only a single instance of a domain object model is
  present at any given time within the application, and prevent
  redundant retrievals.
* `MissingModelDecorator` adds in placeholders when no providers
  have returned domain object models for a specific identifier. This
  allows the user to easily see that something was expected to be
  present, but wasn't.

## Capability Service

```nomnoml
#direction: down
[<abstract> CapabilityService|
  getCapabilities(model : object) : object.<string, Function>
]
[CoreCapabilityProvider]--:>[CapabilityService]
[QueuingPersistenceCapabilityDecorator]--:>[CapabilityService]

[CoreCapabilityProvider]o-[capabilities]
[QueuingPersistenceCapabilityDecorator]o-[CoreCapabilityProvider]
```

The capability service is responsible for determining which capabilities
are applicable for a given domain object, based on its model. Primarily,
this is handled by the `CoreCapabilityProvider`, which examines
capabilities exposed via the `capabilities` extension category.

Additionally, `platform/persistence/queue` decorates the persistence
capability specifically to batch persistence attempts among multiple
objects (this allows failures to be recognized and handled in groups.)

## Persistence Service

```nomnoml
#direction: right
[<abstract> PersistenceService|
  listSpaces() : Promise.<Array.<string>>
  listObjects() : Promise.<Array.<string>>
  createObject(space : string, key : string, document : object) : Promise.<boolean>
  readObject(space : string, key : string, document : object) : Promise.<object>
  updateObject(space : string, key : string, document : object) : Promise.<boolean>
  deleteObject(space : string, key : string, document : object) : Promise.<boolean>
]

[ElasticPersistenceProvider]--:>[PersistenceService]
[ElasticPersistenceProvider]->[<database> ElasticSearch]

[CouchPersistenceProvider]--:>[PersistenceService]
[CouchPersistenceProvider]->[<database> CouchDB]
```

Closely related to the notion of domain objects models is their
persistence. The `PersistenceService` allows these to be saved
and loaded. (Currently, this capability is only used for domain
object models, but the interface has been designed without this idea
in mind; other kinds of documents could be saved and loaded in the
same manner.)

There is no single definitive implementation of a `PersistenceService` in
the platform. Optional adapters are provided to store and load documents
from CouchDB and ElasticSearch, respectively; plugin authors may also
write additional adapters to utilize different back end technologies.

## Action Service

```nomnoml
[ActionService|
  getActions(context : ActionContext) : Array.<Action>
]
[ActionProvider]--:>[ActionService]
[CreateActionProvider]--:>[ActionService]
[ActionAggregator]--:>[ActionService]
[LoggingActionDecorator]--:>[ActionService]

[LoggingActionDecorator]o-[ActionAggregator]
[ActionAggregator]o-[ActionProvider]
[ActionAggregator]o-[CreateActionProvider]

[ActionProvider]o-[actions]
[CreateActionProvider]o-[TypeService]
```

Actions are discrete tasks or behaviors that can be initiated by a user
upon or using a domain object. Actions may appear as menu items or
buttons in the user interface, or may be triggered by certain gestures.