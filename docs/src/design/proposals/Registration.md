# Developer Use Cases

1. Extending and maintaining Open MCT itself.
2. Adapting and customizing Open MCT for use in specific missions.
3. Developing features for use with Open MCT across multiple different
   missions.

# Scope

As demonstrated by the existing APIs, writing plugins is sufficient to
satisfy the three use cases above in the majority of cases. The only feature
which is known to be unsatisfiable by plugins is plugin support itself.

As such, prefer to keep "plugin-external" components small and simple, to
keep the majority of development in plugins (or plugin-like components.)

The "registration API" described in this document is limited to that scope:
It describes classes and patterns that can allow plugins to interact,
while making minimal assumptions about what specific functionality is to
be implemented in these plugins.

By analogy to current API, this set of functionality will effectively
replace the [Framework Layer](http://nasa.github.io/openmctweb/guide/#framework)
of Open MCT.

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

In keeping with the scope of the Registration API, the interfaces
described here are sufficient to:

* Describe the set of plugins in use for a particular instance of
  Open MCT, and initiate their behavior.
* Support common patterns by which plugins can utilize and expose
  defined extension points.

Notably, there is no interdependency between these two sets of
behavior; one could use the base classes for extension points
independently of the plugin mechanism, and vice versa. This both
ensures loose coupling within the Registration API, and also
allows for greater flexibility for developers implementing plugins.

## Application-level Interfaces

```nomnoml
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

Omitted from this diagram (for clarity) are `options` arguments to
`register`, `decorate`, and `compose`. This argument should allow,
at minimum, a `priority` to be specified, in order to control ordering
of registered extensions.

* `Provider<X, S>` is responsible for providing objects of type `S` based
  on zero or more instances of objects of type `X` which have been registered.
  In practice, a `Provider` instance is an extension point within the
  architecture.
  * `get() : S` provides an instance of the architectural component, as
    constructed using the registered objects, along with the highest-priority
    compositor and and decorators.
  * `register(factory : (function () : X), [options] : RegistrationOptions)`
    registers an object (as returned by the provided `factory` function)
    with this provider. Evaluation of the provided `factory` will be
    deferred until the first `get()` call to the `Provider`.
  * `compose(compositor : (function (X[]) : S), [options] : RegistrationOptions)`
    introduces a new strategy for converting an array of registered objects
    of type `X` into a single instance of an object of type `S`. The
    highest-priority `compositor` that has been registered in this fashion
    will be used to assemble the provided object (before decoration)
  * `decorate(decorator : (function (S) : S), [options] : RegistrationOptions)`
    augments behavior of objects provided by `get`, in priority order.
* `ServiceProvider<S>` provides analogous support for the _composite services_
  pattern used throughout Open MCT (which, in turn, is a superset of the
  functionality needed for plain services.)
* `Registry<T>` provides analogous support for _extension categories_, also
  used ubiquitously through Open MCT.

# Examples

The following examples are provided to illustrate the intended usage of
the Registration API. Particular attention is given to obeying and
utilizing the "dependency injection as code style"
[decision from the API Redesign](APIRedesign.md#decisions).

## Building Applications on Open MCT

Applications built using Open MCT are expected to extend the `MCT` base
class and should typically self-install distinguishing plugins during
the constructor call. Any pre-installed plugins that are undesirable
should also be uninstalled at this point (to support such usage,
`MCT` should expose instances of any installed plugins that are
considered optional.)

For example:

```
define(['mct', './plugins'], function (mct, plugins) {
  var MCT = mct.MCT;

  function Variant() {
    MCT.call(this);

    this.install(new plugins.SomePlugin());
    this.install(new plugins.SomeOtherPlugin(this.core));

    this.uninstall(this.plugins.persistence.localStorage);
  }

  Variant.prototype = Object.create(MCT.prototype);

  return Variant;
});
```

Running an application build using Open MCT then typically looks like:

```
define(['./Variant], function (Variant) {
  new Variant().run();
});
```

## Writing Plugins

A plugin for Open MCT should inherit from the `Plugin` base class.

Plugins will typically use extension points exposed by other plugins;
put another way, plugins will typically _depend_ upon other plugins.
Consistent with "dependency injection as a code style," the preferred
way for plugins to acquire these references is via constructor
arguments. (Put another way, in order to use a plugin, you are expected
to supply its dependencies.) Note that this is not a requirement,
as Open MCT only ever interacts directly with plugin _instances_;
any other way of assembling an object with the `Plugin` interface
should be compatible.

Plugins will also typically expose extension points. The preferred
way to do this is to expose `Provider` instances as public fields
of plugins, but this is a matter of code style, and is not enforced
or expected by the Registration API.

For example, if a plugin depends on the `core` plugin of MCT:

```
define(['mct', './SomeAction'], function (mct, SomeAction) {
  var Plugin = mct.Plugin,
    ServiceProvider = mct.ServiceProvider;

  function ExamplePlugin(core) {
    Plugin.call(this, function () {
      core.actionRegistry.register(function () {
        return new SomeAction();
      });
    });

    this.someServiceProvider = new ServiceProvider();
    this.someServiceProvider.register(function () {
      return new SomeService();
    });
  }

  ExamplePlugin.prototype = Object.create(Plugin.prototype);

  return ExamplePlugin;
});
```

Using this plugin then looks like:

```
define([
  'mct',
  './ExamplePlugin',
  './OtherPlugin'
], function (mct, ExamplePlugin, OtherPlugin) {
  var MCT = mct.MCT;

  function MyApplication() {
    MCT.call(this);

    this.examplePlugin = new ExamplePlugin(this.core);
    this.otherPlugin = new OtherPlugin(this.examplePlugin);

    this.install(this.examplePlugin);
    this.install(this.otherPlugin);
  }

  MyApplication.prototype = Object.create(MCT.prototype);

  return MyApplication;
});
```

## Using Extension Points

The services and extensions exposed by providers are retrieved via
`get` calls to those providers. These calls are expected to occur
during registration of other extensions, _or_ in the `start` phase
of the plugin lifecycle.

There are effectively four distinct stages for a plugin:

* __Pre-initialization__. This is the plugin immediately after its
  constructor call. Any extension points exposed by the plugin are
  expected to be defined during this stage.
* __Initialization__. Triggered by calling `initialize`; invokes

For example:

```
define(['mct', './SomeAction'], function (mct, SomeAction) {
  var Plugin = mct.Plugin;

  function MyPlugin(core, notificationPlugin) {
    var notificationServiceProvider =
      notificationPlugin.notificationServiceProvider;

    Plugin.call(this, function initialize() {
      // During this stage, extensions may be installed and other
      // general plugin configuration should occur.
      // Calls to get should be avoided at this stage, as
      // providers may not be fully configured.
      core.actionRegistry.register(function () {
        // In factory functions, however, get calls are expected;
        // this is when dependencies actually get injected.
        // Calls which register/configure extensions should be
        // avoided at this point. 
        return new SomeAction(notificationServiceProvider.get());
      });
    }, function start() {
      // Any behavior that should occur when the application starts.
      // All providers should be fully-configured at this point; `get`
      // calls may be issued freely at this point, and no more
      // registration should occur. This stage is not useful to most
      // plugins and this argument would typically be omitted.

      notifications.notificationServiceProvider.get()
        .notify("Hello world!");
    });

    // Code in the constructor is run when the plugin is instantiated;
    // any extension points exposed by the plugin should be declared
    // here, typically as providers.
    this.someRegistry = new mct.Registry();
  }

  MyPlugin.prototype = Object.create(Plugin.prototype);

  return MyPlugin;

});
```

# Evaluation

[Identified problems](#problems-to-address) are addressed by this solution:

1. Dependencies between plugins can be made explicit; a `Plugin` may
   impose dependencies on other specific `Plugin` subclasses as constructor
   arguments, disambiguated with JSDoc. The software does not take part
   in dependency management among plugins; rather, this responsibility is
   plainly communicated to developers.
2. Extension points are made explicit; `Provider` instances must be
   reachable for plugins to configure, and may be made available as
   public fields of `Plugin`s. Their types can be clearly documented,
   usages and interactions can be followed with standard developer tools
   (e.g. breakpoints), and so on.
3. Reuse of classes between plugins is neither facilitated nor impeded
   by the registration API. If, however, plugins are written following the
   "expose classes in namespaces" approach, then it is trivially to
   expose additional classes in these same namespaces.

This solution offers further benefits:

* The `Provider` API is robust enough to support the various existing
  extensions of Open MCT, but its usage is opt-in; plugins are free
  to expose other (potentially wildly different) means of extension.
  Usage of `Provider`s is _encouraged_ to promote ubiquitous
  extensibility, but no limitation is exposed.
* By moving everything into classes which accept dependencies, a
  degree of inflexibility is removed from the architecture. In principle,
  it should be possible to run multiple instances of `MCT` (with
  their own service instances, etc.) within the same environment. While
  this is not specifically desirable, it reflects a generally looser
  coupling between the software and it environment (no expectation of a
  `bundles.json`, no usage of global state at the language level or
  effectively-global state at the RequireJS level, etc.) and implies
  greater flexibility of the application's components.
* Provides a reduction in code associated with a particular capability;
  the Framework Layer consists of 18 classes (and has broader
  responsibilities, including script-loading) whereas this approach
  consists of 6 classes. (Although some additional work for Angular
  integration and legacy support will also be needed before achieving
  parity with the Framework Layer.)

There are some problems with this approach:

* It is highly sensitive to ordering; does not address the problem of
  [separating configuration from use](http://www.martinfowler.com/articles/injection.html#SeparatingConfigurationFromUse),
  but instead leaves this as a problem to solve with code style
  (requiring familiarity with the system.) This is particularly
  true with `Provider#get` (don't want to invoke before configuration
  is finished), but also true for `Application` and `Plugin`.
  * One approach to mitigate this would be to throw `Error`s when
    calls are made out-of-order (e.g. configuration after use.)
* Some redundancy among interfaces (`Plugin` and `Application` both
  look a lot like a `Provider`, but of what?)
  * But, don't want to over-exercise commonalities and end up with
    unclear interfaces.