# Imperative Plugins

This is a design proposal for handling
[bundle declarations in JavaScript](
APIRedesign.md#bundle-declarations-in-javascript).

## Developer Use Cases

Developers will want to use bundles/plugins to (in rough order
of occurrence):

1. Add new extension instances.
2. Use existing services
3. Add new service implementations.
4. Decorate service implementations.
5. Decorate extension instances.
6. Add new types of services.
7. Add new extension categories.

Notably, bullets 4 and 5 above are currently handled implicitly,
which has been cited as a source of confusion.

## Interfaces

Two base classes may be used to satisfy these use cases:

 * The `CompositeServiceFactory` provides composite service instances.
   Decorators may be added; the approach used for compositing may be
   modified; and individual services may be registered to support compositing.
 * The `ExtensionRegistry` allows for the simpler case where what is desired
   is an array of all instances of some kind of thing within the system.

Note that additional developer use cases may be supported by using the
more general-purpose `Registry`

```nomnoml
[Factory.<T, V>
  |
  - factoryFn : function (V) : T
  |
  + decorate(decoratorFn : function (T, V) : T, options? : RegistrationOptions)
]-:>[function (V) : T]

[RegistrationOptions |
  + priority : number or string
]

[Registry.<T, V>
  |
  - compositorFn : function (Array.<T>) : V
  |
  + register(item : T, options? : RegistrationOptions)
  + composite(compositorFn : function (Array.<T>) : V, options? : RegistrationOptions)
]-:>[Factory.<V, Void>]
[Factory.<V, Void>]-:>[Factory.<T, V>]

[ExtensionRegistry.<T>]-:>[Registry.<T, Array.<T>>]
[Registry.<T, Array.<T>>]-:>[Registry.<T, V>]

[CompositeServiceFactory.<T>]-:>[Registry.<T, T>]
[Registry.<T, T>]-:>[Registry.<T, V>]
```

## Examples

### 1. Add new extension instances.

```js
// Instance-style registration
mct.types.register(new mct.Type({
    key: "timeline",
    name: "Timeline",
    description: "A container for activities ordered in time."
});

// Factory-style registration
mct.actions.register(function (domainObject) {
    return new RemoveAction(domainObject);
}, { priority: 200 });
```

### 2. Use existing services

```js
mct.actions.register(function (domainObject) {
    var dialogService = mct.ui.dialogServiceFactory();
    return new PropertiesAction(dialogService, domainObject);
});
```

### 3. Add new service implementations

```js
// Instance-style registration
mct.persistenceServiceFactory.register(new LocalPersistenceService());

// Factory-style registration
mct.persistenceServiceFactory.register(function () {
    var $http = angular.injector(['ng']).get('$http');
    return new LocalPersistenceService($http);
});
```

### 4. Decorate service implementations

```js
mct.modelServiceFactory.decorate(function (modelService) {
    return new CachingModelDecorator(modelService);
}, { priority: 100 });
```

### 5. Decorate extension instances

```js
mct.capabilities.decorate(function (capabilities) {
    return capabilities.map(decorateIfApplicable);
});
```

This use case is not well-supported by these API changes. The most
common case for decoration is capabilities, which are under reconsideration;
should consider handling decoration of capabilities in a different way.

### 6. Add new types of services

```js
myModule.myServiceFactory = new mct.CompositeServiceFactory();

// In cases where a custom composition strategy is desired
myModule.myServiceFactory.composite(function (services) {
    return new MyServiceCompositor(services);
});
```

### 7. Add new extension categories.

```js
myModule.hamburgers = new mct.ExtensionRegistry();
```

## Evaluation

### Benefits

* Encourages separation of registration from declaration (individual
  components are decoupled from the manner in which they are added
  to the architecture.)
* Minimizes "magic." Dependencies are acquired, managed, and exposed
  using plain-old-JavaScript without any dependency injector present
  to obfuscate what is happening.
* Offers comparable expressive power to existing APIs; can still
  extend the behavior of platform components in a variety of ways.
* Does not force or limit formalisms to use;

### Detriments

* Does not encourage separation of dependency acquisition from
  declaration; that is, it would be quite natural using this API
  to acquire references to services during the constructor call
  to an extension or service. But, passing these in as constructor
  arguments is preferred (to separate implementation from architecture.)
* Adds (negligible?) boilerplate relative to declarative syntax.
* Relies on factories, increasing number of interfaces to be concerned
  with.