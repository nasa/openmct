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
