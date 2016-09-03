# Overview

The Open MCT platform utilizes the [framework layer](framework.md)
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

The run-time architecture of an Open MCT application can be categorized
into certain high-level tiers:

```nomnoml
[DOM]->[<state> AngularJS]
[AngularJS]->[Presentation Layer]
[Presentation Layer]->[Information Model]
[Presentation Layer]->[Service Infrastructure]
[Information Model]->[Service Infrastructure]
[Service Infrastructure]->[<state> Browser APIs]
[Browser APIs]->[Back-end]
```

Applications built using Open MCT may add or configure functionality
in __any of these tiers__.

* _DOM_: The rendered HTML document, composed from HTML templates which
  have been processed by AngularJS and will be updated by AngularJS
  to reflect changes from the presentation layer. User interactions
  are initiated from here and invoke behavior in the presentation layer. HTML 
  templates are written in Angular’s template syntax; see the [Angular documentation on templates](https://docs.angularjs.org/guide/templates)​. 
  These describe the page as actually seen by the user. Conceptually, 
  stylesheets (controlling the look-and-feel of the rendered templates) belong 
  in this grouping as well. 
* [_Presentation layer_](#presentation-layer): The presentation layer
  is responsible for updating (and providing information to update)
  the displayed state of the application. The presentation layer consists
  primarily of _controllers_ and _directives_. The presentation layer is
  concerned with inspecting the information model and preparing it for
  display.
* [_Information model_](#information-model): ​Provides a common (within Open MCT 
  Web) set of interfaces for dealing with “things” ­ domain objects ­ within the 
  system. User-facing concerns in a Open MCT Web application are expressed as 
  domain objects; examples include folders (used to organize other domain 
  objects), layouts (used to build displays), or telemetry points (used as 
  handles for streams of remote measurements.) These domain objects expose a 
  common set of interfaces to allow reusable user interfaces to be built in the 
  presentation and template tiers; the specifics of these behaviors are then 
  mapped to interactions with underlying services. 
* [_Service infrastructure_](#service-infrastructure): The service
  infrastructure is responsible for providing the underlying general
  functionality needed to support the information model. This includes
  exposing underlying sets of extensions and mediating with the
  back-end.
* _Back-end_: The back-end is out of the scope of Open MCT, except
  for the interfaces which are utilized by adapters participating in the
  service infrastructure. Includes the underlying persistence stores, telemetry 
  streams, and so forth which the Open MCT Web client is being used to interact 
  with.

## Application Start-up

Once the
[application has been initialized](Framework.md#application-initialization)
Open MCT primarily operates in an event-driven paradigm; various
events (mouse clicks, timers firing, receiving responses to XHRs) trigger
the invocation of functions, typically in the presentation layer for
user actions or in the service infrastructure for server responses.

The "main point of entry" into an initialized Open MCT application
is effectively the
[route](https://docs.angularjs.org/api/ngRoute/service/$route#example)
which is associated with the URL used to access Open MCT (or a
default route.) This route will be associated with a template which
will be displayed; this template will include references to directives
and controllers which will be interpreted by Angular and used to
initialize the state of the display in a manner which is backed by
both the information model and the service infrastructure.

```nomnoml
[<start> Start]->[<state> page load]
[page load]->[<state> route selection]
[route selection]->[<state> compile, display template]
[compile, display template]->[Template]
[Template]->[<state> use Controllers]
[Template]->[<state> use Directives]
[use Controllers]->[Controllers]
[use Directives]->[Directives]
[Controllers]->[<state> consult information model]
[consult information model]->[<state> expose data]
[expose data]->[Angular]
[Angular]->[<state> update display]
[Directives]->[<state> add event listeners]
[Directives]->[<state> update display]
[add event listeners]->[<end> End]
[update display]->[<end> End]
```


# Presentation Layer

The presentation layer of Open MCT is responsible for providing
information to display within templates, and for handling interactions
which are initiated from templated DOM elements. AngularJS acts as
an intermediary between the web page as the user sees it, and the
presentation layer implemented as Open MCT extensions.

```nomnoml
[Presentation Layer|
  [Angular built-ins|
    [routes]
    [controllers]
    [directives]
    [templates]
  ]
  [Domain object representation|
    [views]
    [representations]
    [representers]
    [gestures]
  ]
]
```

## Angular built-ins

Several extension categories in the presentation layer map directly
to primitives from AngularJS:

* [_Controllers_](https://docs.angularjs.org/guide/controller) provide
  data to templates, and expose functionality that can be called from
  templates.
* [_Directives_](https://docs.angularjs.org/guide/directive) effectively
  extend HTML to provide custom behavior associated with specific
  attributes and tags.
* [_Routes_](https://docs.angularjs.org/api/ngRoute/service/$route#example)
  are used to associate specific URLs (including the fragment identifier)
  with specific application states. (In Open MCT, these are used to
  describe the mode of usage - e.g. browse or edit - as well as to
  identify the object being used.)
* [_Templates_](https://docs.angularjs.org/guide/templates) are partial
  HTML documents that will be rendered and kept up-to-date by AngularJS.
  Open MCT introduces a custom `mct-include` directive which acts
  as a wrapper around `ng-include` to allow templates to be referred
  to by symbolic names.

## Domain object representation

The remaining extension categories in the presentation layer are specific
to displaying domain objects.

* _Representations_ are templates that will be used to display
  domain objects in specific ways (e.g. "as a tree node.")
* _Views_ are representations which are exposed to the user as options
  for displaying domain objects.
* _Representers_ are extensions which modify or augment the process
  of representing domain objects generally (e.g. by attaching
  gestures to them.)
* _Gestures_ provide associations between specific user actions
  (expressed as DOM events) and resulting behavior upon domain objects
  (typically expressed as members of the `actions` extension category)
  that can be reused across domain objects. For instance, `drag` and
  `drop` are both gestures associated with using drag-and-drop to
  modify the composition of domain objects by interacting with their
  representations.

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

Domain objects are the most fundamental component of Open MCT's
information model. A domain object is some distinct thing relevant to a
user's work flow, such as a telemetry channel, display, or similar.
Open MCT is a tool for viewing, browsing, manipulating, and otherwise
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

Most services exposed by the Open MCT platform follow the
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
  [TelemetryService]->[<database> Telemetry source]
  [ActionService]->[actions]
  [ActionService]->[PolicyService]
  [ViewService]->[PolicyService]
  [ViewService]->[views]
  [PolicyService]->[policies]
  [TypeService]->[types]
]
```

A short summary of the roles of these services:

* _[ObjectService](#object-service)_: Allows retrieval of domain objects by
  their identifiers; in practice, often the main point of entry into the
  [information model](#information-model).
* _[ModelService](#model-service)_: Provides domain object models, retrieved
  by their identifier.
* _[CapabilityService](#capability-service)_: Provides capabilities, as they
  apply to specific domain objects (as judged from their model.)
* _[TelemetryService](#telemetry-service)_: Provides access to historical
  and real-time telemetry data.
* _[PersistenceService](#persistence-service)_: Provides the ability to
  store and retrieve documents (such as domain object models.)
* _[ActionService](#action-service)_: Provides distinct user actions that
  can take place within the system (typically, upon or using domain objects.)
* _[ViewService](#view-service)_: Provides views for domain objects. A view
  is a user-selectable representation of a domain object (in practice, an
  HTML template.)
* _[PolicyService](#policy-service)_: Handles decisions about which
  behavior are allowed within certain specific contexts.
* _[TypeService](#type-service)_: Provides information to distinguish
  different types of domain objects from one another within the system.

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

As domain objects are central to Open MCT's information model,
acquiring domain objects is equally important.

```nomnoml
#direction: right
[<start> Start]->[<state> Look up models]
[<state> Look up models]->[<state> Look up capabilities]
[<state> Look up capabilities]->[<state> Instantiate DomainObject]
[<state> Instantiate DomainObject]->[<end> End]
```

Open MCT includes an implementation of an `ObjectService` which
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

## Telemetry Service

```nomnoml
[<abstract> TelemetryService|
  requestData(requests : Array.<TelemetryRequest>) : Promise.<object>
  subscribe(requests : Array.<TelemetryRequest>) : Function
]<--:[TelemetryAggregator]
```

The telemetry service is responsible for acquiring telemetry data.

Notably, the platform does not include any providers for
`TelemetryService`; applications built on Open MCT will need to
implement a provider for this service if they wish to expose telemetry
data. This is usually the most important step for integrating Open MCT
into an existing telemetry system.

Requests for telemetry data are usually initiated in the
[presentation layer](#presentation-layer) by some `Controller` referenced
from a view. The `telemetryHandler` service is most commonly used (although
one could also use an object's `telemetry` capability directly) as this
handles capability delegation, by which a domain object such as a Telemetry
Panel can declare that its `telemetry` capability should be handled by the
objects it contains. Ultimately, the request for historical data and the
new subscriptions will reach the `TelemetryService`, and, by way of the
provider(s) which are present for that `TelemetryService`, will pass the
same requests to the back-end.

```nomnoml
[<start> Start]->[Controller]
[Controller]->[<state> declares object of interest]
[declares object of interest]->[TelemetryHandler]
[TelemetryHandler]->[<state> requests telemetry from capabilities]
[TelemetryHandler]->[<state> subscribes to telemetry using capabilities]
[requests telemetry from capabilities]->[TelemetryCapability]
[subscribes to telemetry using capabilities]->[TelemetryCapability]
[TelemetryCapability]->[<state> requests telemetry]
[TelemetryCapability]->[<state> subscribes to telemetry]
[requests telemetry]->[TelemetryService]
[subscribes to telemetry]->[TelemetryService]
[TelemetryService]->[<state> issues request]
[TelemetryService]->[<state> updates subscriptions]
[TelemetryService]->[<state> listens for real-time data]
[issues request]->[<database> Telemetry Back-end]
[updates subscriptions]->[Telemetry Back-end]
[listens for real-time data]->[Telemetry Back-end]
[Telemetry Back-end]->[<end> End]
```

The back-end, in turn, is expected to provide whatever historical
telemetry is available to satisfy the request that has been issue.

```nomnoml
[<start> Start]->[<database> Telemetry Back-end]
[Telemetry Back-end]->[<state> transmits historical telemetry]
[transmits historical telemetry]->[TelemetryService]
[TelemetryService]->[<state> packages telemetry, fulfills requests]
[packages telemetry, fulfills requests]->[TelemetryCapability]
[TelemetryCapability]->[<state> unpacks telemetry per-object, fulfills request]
[unpacks telemetry per-object, fulfills request]->[TelemetryHandler]
[TelemetryHandler]->[<state> exposes data]
[TelemetryHandler]->[<state> notifies controller]
[exposes data]->[Controller]
[notifies controller]->[Controller]
[Controller]->[<state> prepares data for template]
[prepares data for template]->[Template]
[Template]->[<state> displays data]
[displays data]->[<end> End]
```

One peculiarity of this approach is that we package many responses
together at once in the `TelemetryService`, then unpack these in the
`TelemetryCapability`, then repackage these in the `TelemetryHandler`.
The rationale for this is as follows:

* In the `TelemetryService`, we want to have the ability to combine
  multiple requests into one call to the back-end, as many back-ends
  will support this. It follows that we give the response as a single
  object, packages in a manner that allows responses to individual
  requests to be easily identified.
* In the `TelemetryCapability`, we want to provide telemetry for a
  _single object_, so the telemetry data gets unpacked. This allows
  for the unpacking of data to be handled in a single place, and
  also permits a flexible substitution method; domain objects may have
  implementations of the `telemetry` capability that do not use the
  `TelemetryService` at all, while still maintaining compatibility
  with any presentation layer code written to utilize this capability.
  (This is true of capabilities generally.)
* In the `TelemetryHandler`, we want to group multiple responses back
  together again to make it easy for the presentation layer to consume.
  In this case, the grouping is different from what may have occurred
  in the `TelemetryService`; this grouping is based on what is expected
  to be useful _in a specific view_. The `TelemetryService`
  may be receiving requests from multiple views.

```nomnoml
[<start> Start]->[<database> Telemetry Back-end]
[Telemetry Back-end]->[<state> notifies client of new data]
[notifies client of new data]->[TelemetryService]
[TelemetryService]->[<choice> relevant subscribers?]
[relevant subscribers?] yes ->[<state> notify subscribers]
[relevant subscribers?] no ->[<state> ignore]
[ignore]->[<end> Ignored]
[notify subscribers]->[TelemetryCapability]
[TelemetryCapability]->[<state> notify listener]
[notify listener]->[TelemetryHandler]
[TelemetryHandler]->[<state> exposes data]
[TelemetryHandler]->[<state> notifies controller]
[exposes data]->[Controller]
[notifies controller]->[Controller]
[Controller]->[<state> prepares data for template]
[prepares data for template]->[Template]
[Template]->[<state> displays data]
[displays data]->[<end> End]
```

The flow of real-time data is similar, and is handled by a sequence
of callbacks between the presentation layer component which is
interested in data and the telemetry service. Providers in the
telemetry service listen to the back-end for new data (via whatever
mechanism their specific back-end supports), package this data in
the same manner as historical data, and pass that to the callbacks
which are associated with relevant requests.

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
[PolicyActionDecorator]--:>[ActionService]

[LoggingActionDecorator]o-[PolicyActionDecorator]
[PolicyActionDecorator]o-[ActionAggregator]
[ActionAggregator]o-[ActionProvider]
[ActionAggregator]o-[CreateActionProvider]

[ActionProvider]o-[actions]
[CreateActionProvider]o-[TypeService]
[PolicyActionDecorator]o-[PolicyService]
```

Actions are discrete tasks or behaviors that can be initiated by a user
upon or using a domain object. Actions may appear as menu items or
buttons in the user interface, or may be triggered by certain gestures.

Responsibilities of platform components of the action service are as
follows:

* `ActionProvider` exposes actions registered via extension category
  `actions`, supporting simple addition of new actions. Actions are
  filtered down to match action contexts based on criteria defined as
  part of an action's extension definition.
* `CreateActionProvider` provides the various Create actions which
  populate the Create menu. These are driven by the available types,
  so do not map easily to extension category `actions`; instead, these
  are generated after looking up which actions are available from the
  [`TypeService`](#type-service).
* `ActionAggregator` merges together actions from multiple providers.
* `PolicyActionDecorator` enforces the `action` policy category by
  filtering out actions which violate this policy, as determined by
  consulting the [`PolicyService`](#policy-service).
* `LoggingActionDecorator` wraps exposed actions and writes to the
  console when they are performed.

## View Service

```nomnoml
[ViewService|
  getViews(domainObject : DomainObject) : Array.<View>
]
[ViewProvider]--:>[ViewService]
[PolicyViewDecorator]--:>[ViewService]

[ViewProvider]o-[views]
[PolicyViewDecorator]o-[ViewProvider]
```

The view service provides views that are relevant to a specified domain
object. A "view" is a user-selectable visualization of a domain object.

The responsibilities of components of the view service are as follows:

* `ViewProvider` exposes views registered via extension category
  `views`, supporting simple addition of new views. Views are
  filtered down to match domain objects based on criteria defined as
  part of a view's extension definition.
* `PolicyViewDecorator` enforces the `view` policy category by
  filtering out views which violate this policy, as determined by
  consulting the [`PolicyService`](#policy-service).

## Policy Service

```nomnoml
[PolicyService|
  allow(category : string, candidate : object, context : object, callback? : Function) : boolean
]
[PolicyProvider]--:>[PolicyService]
[PolicyProvider]o-[policies]
```

The policy service provides a general-purpose extensible decision-making
mechanism; plugins can add new extensions of category `policies` to
modify decisions of a known category.

Often, the policy service is referenced from a decorator for another
service, to filter down the results of using that service based on some
appropriate policy category.

The policy provider works by looking up all registered policy extensions
which are relevant to a particular _category_, then consulting each in
order to see if they allow a particular _candidate_ in a particular
_context_; the types for the `candidate` and `context` arguments will
vary depending on the `category`. Any one policy may disallow the
decision as a whole.


```nomnoml
[<start> Start]->[<state> is something allowed?]
[is something allowed?]->[PolicyService]
[PolicyService]->[<state> look up relevant policies by category]
[look up relevant policies by category]->[<state> consult policy #1]
[consult policy #1]->[Policy #1]
[Policy #1]->[<choice> policy #1 allows?]
[policy #1 allows?] no ->[<state> decision disallowed]
[policy #1 allows?] yes ->[<state> consult policy #2]
[consult policy #2]->[Policy #2]
[Policy #2]->[<choice> policy #2 allows?]
[policy #2 allows?] no ->[<state> decision disallowed]
[policy #2 allows?] yes ->[<state> consult policy #3]
[consult policy #3]->[<state> ...]
[...]->[<state> consult policy #n]
[consult policy #n]->[Policy #n]
[Policy #n]->[<choice> policy #n allows?]
[policy #n allows?] no ->[<state> decision disallowed]
[policy #n allows?] yes ->[<state> decision allowed]
[decision disallowed]->[<end> Disallowed]
[decision allowed]->[<end> Allowed]
```

The policy decision is effectively an "and" operation over the individual
policy decisions: That is, all policies must agree to allow a particular
policy decision, and the first policy to disallow a decision will cause
the entire decision to be disallowed. As a consequence of this, policies
should generally be written with a default behavior of "allow", and
should only disallow the specific circumstances they are intended to
disallow.

## Type Service

```nomnoml
[TypeService|
  listTypes() : Array.<Type>
  getType(key : string) : Type
]
[TypeProvider]--:>[TypeService]
[TypeProvider]o-[types]
```

The type service provides metadata about the different types of domain
objects that exist within an Open MCT application. The platform
implementation reads these types in from extension category `types`
and wraps them in a JavaScript interface.
