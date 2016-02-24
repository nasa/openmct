# Developer Use Cases

1. Extending and maintaining Open MCT itself.
2. Adapting and customizing Open MCT for use in specific missions.
3. Developing features for use with Open MCT across multiple different
   missions.

# Scope

As demonstrated by the existing APIs, writing plugins is sufficient to
satisfy the three use cases above in the majority of cases. The only feature
which is known to be unsatisfiable by plugins is plugin support itself.

As such, prefer to keep "plugin-external" components small as simple, to
keep the majority of development in plugins (or plugin-like components.)

The "registration API" described in this document is limited to that scope:
It describes classes and patterns that can allow plugins to interact,
while making minimal assumptions about what specific functionality is to
be implemented in these plugins.

# Problems to Address

1. Dependencies between plugins are implicit; a plugin may fail if its
   required dependencies are not included, without any clear indication
   of why this failure has occurred. Significant familiarity with
   Open MCT is typically required to debug in these circumstances.
2. Extension points are often implicit; no specific plugin is
   identifiably responsible for defining any specific extension category
   or composite service. These are instead paired by string matching.
   This makes it difficult to follow how the application is initialized
   and how objects are passed around at run-time, and creates an
   additional documentation burden, as these named extension points do not
   fit into more standard API documentation.
3. Reuse of components between plugins is limited. Exposing base classes
   from one plugin and reusing them from another is overly-difficult.

# Principles

1. The Registration API is exposed as a set of classes in one or more
   namespaces. This supports reuse and extension using standard,
   well-known object-oriented patterns. A composition-oriented style
   is still supported and encouraged, but not enforced.
2. Extension points should be expressed as objects with known interfaces.
   (More specifically, they should be _expressible_ in this fashion;
   it is out of scope for the Registration API to expose any specific
   extension points.)
3. Dependencies that are intended for injection should be expressed as
   arguments to a constructor. The Registration API does not need to
   stipulate this, but should at least be compatible with this. This
   is both to allow for compatibility with existing code, and to allow
   for clear documentation of the dependencies of specific components
   ("to construct one of these, you need one of those.")
4. The Registration API should accept minimal responsibility in order
   to impose minimal constraints. For instance, it should not be
   responsible for performing script-loading. Its sole responsibility
   is to facilitate communication between components.
5. The Registration API should continue to support ubiquitous use of
   patterns that have proven useful for plugin-based extensibility
   (the Registry, Composite, and Decorator patterns, specifically.)
   However, it should be designed such that knowledge of these patterns
   is only required when it is appropriate to the specific task or
   activity at hand. (For instance, you should not need to be familiar
   with decorators in order to simply register something.)

# Interfaces

## Applications and Plugins

```nomnoml
#direction: down

[Application |
    install(plugin : Plugin)
    uninstall(plugin : Plugin)
    run()
]

[Plugin |
    initialize()
    start()
]

[Application]<:-[MCT |
    core : Plugin
    ui : Plugin
    policy : Plugin
    ...etc
]
[Application]-o[Plugin]
```

Summary of interfaces:

* `Application` represents a complete piece of software that has been
  composed of plugins.
  * `install(plugin)` adds a plugin to this application.
  * `uninstall(plugin)` removes a plugin from this application.
  * `run()` starts the application. This will first initialize all
    plugins, then start all plugins.
* `Plugin` represents a unit of functionality available for use within
  applications. It exposes methods to be triggered at various points
  in the application lifecycle. A plugin is meant to be "single-use";
  multiple calls to `initialize()` and/or `start()` should have no
  effect.
  * `initialize()` performs any configuration and/or registration
    associated with this plugin.
  * `start()` initiates any behavior associated with this plugin that
    needs to run immediately after the application has started. (Useful
    for a "bootstrap" plugin.)
* `MCT` is an instance of an `Application` that self-installs various
  plugins during its constructor call. It also exposes these same
  plugins as public fields such that other applications may access
  them (to `uninstall` them, for instance, or to pass them into other
  plugins.)

Rationale for various interfaces:

* `Application` separates out a core responsibility of Open MCT (plugin
  composition) from the specific details of Open MCT (the set of plugins
  which compose it.)
  * `install` allows plugins to be added (central to plugin support.)
  * `uninstall` allows plugins to be removed in circumstances where they
    are unwanted; have observed practical cases where this is desirable.
  * `run` separates instantiation of the application from the initiation
    of its behavior.
* `Plugin` provides an interface for `Application` to use when accepting
  plugins, and a base class for plugin developers to extend from.
  * `initialize` is useful to `Application`, which wants to implement
    `run` in a manner which wholly separates initialization (the wiring
    up of various services/registries) from bootstrapping.
  * `start` is useful to `Application`, to start any run-time behavior
    once the application is fully-configured.
* `MCT` is useful to producers of software built on Open MCT, who would
  like a baseline set of functionality to build upon.

Applications built on Open MCT are expected to be exposed as classes
which extend `MCT` and add/remove plugins during the constructor
call. (This is a recommended pattern of use only; other, more
imperative usage of this API is equally viable.)


## Extension Points

```nomnoml
[Provider<X,S> |
    get() : S
    register(factory : (function () : S))
    decorate(decorator : (function (S) : S))
    compose(compositor : (function (Array<X>) : S))
]

[Provider<X,S>]<:-[Provider<T,Array<T>>]
[Provider<T,Array<T>>]<:-[Registry<T>]
[Provider<X,S>]<:-[Provider<S,S>]
[Provider<S,S>]<:-[ServiceProvider<S>]
```


# Interfaces

* `Dependency<S>` is an interface describing dependencies generally.
  * `get() : S` provides an instance of the architectural component.
* `Provider<X, S>` extends `Dependency<S>`. It is responsible for providing
  objects of type `S` based
  on zero or more instances of objects of type `X` which have been registered.
  In practice, a `Provider` instance is an extension point within the
  architecture.
  * `register(factory : (function () : X), [options] : RegistrationOptions)`
    registers an object (as returned by the provided `factory` function)
    with this provider. Evaluation of the provided `factory` will be
    deferred until the first `get()` call to the `Provider`.
  * `composite(compositor : (function (X[]) : S), [options] : RegistrationOptions)`
    introduces a new strategy for converting an array of registered objects
    of type `X` into a single instance of an object of type `S`. The
    highest-priority `compositor` that has been registered in this fashion
    will be used to assemble the provided object (before decoration)
  * `decorate(decorator : (function (S) : S), [options] : RegistrationOptions)`
    augments behavior of provided objects, in priority order.

`Registry<T>` extends `Provider<T, T[]>`. It provides simple registries, where
a full list of all registered extensions of a certain category may be readily
accessed.

`ServiceProvider<T>` extends `Provider<T, T>`. It provides single instances of
services, and allows service instances of the same type to be registered.
The default composition strategy is to provide the highest-priority service
which has been registered.

# Turtles All the Way Down

An `Initializer` provides an interface of communicating application life
cycle events to application components (such as plugins.)
* `install()`: Install any extensions associate with the component.
* `start()`: Perform any application start-up behavior associated with
  this component.

`Application` extends `Provider<Dependency<Initializer>, Initializer>`.
* `run()`: Run the `install` phases of all registered components, then
  runs the `start` phases of all registered components.

As such, the following _could_ be valid initialization code
(but wait, there's more):

```js
var app = new mct.Application();

app.register(new mct.Core());

app.run(window);
```

`MCT` extends `Application` by self-registering common plugins.

Other variants may similarly extend `MCT` and self-register additional
plugins. As such, bootstrapping an `MCT`-derived application should
be as simple as:

```
define(['Variant'], function (Variant) {
  new Variant().run();
});
```

Where `Variant` may simply look like:

```
define(['mct', './plugins'], function (mct, plugins) {
  var MCT = mct.MCT;

  function Variant() {
    MCT.call(this);

    this.register(new plugins.SomePlugin());
    this.register(new plugins.SomeOtherPlugin());
  }

  Variant.prototype = Object.create(MCT.prototype);

  return Variant;
});
```
