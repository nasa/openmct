Framework-level components for Open MCT Web. This is Angular and Require, 
with an extra layer to mediate between them and act as an extension 
mechanism to allow plug-ins to be introduced declaratively.

# Usage

This section needs to be written. For now, refer to implementation notes and
examples in `example/builtins`, `example/extensions`, and `example/composite`.

## Circular dependencies

The framework layer (like Angular itself) does not support circular
dependencies among extensions. Generally, circular dependencies can be
avoided by refactoring; for instance, a dependency-less intermediary can be
added by two parties which depend upon one another, and both can depend upon
this intermediary while one abandons its dependency to the other (the
intermediary must then provide the functionality that was needed in the
abandoned dependency.)

In some cases this refactoring is non-obvious or ineffective (for instance,
when a service component depends upon the whole.) In these cases, Angular's
`$injector` may be used to break the declaration-time dependency, by allowing
retrieval of the dependency at use-time instead. (This is essentially the
same solution as above, where `$injector` acts as an application-global
generalized intermediary.)

# Implementation Notes

The framework layer is responsible for performing a four-stage initialization
process. These stages are:

1. __Loading definitions.__ JSON declarations are loaded for all bundles which
   will constitute the application, and wrapped in a useful API for subsequent
   stages. _Sources in `src/load`_
2. __Resolving extensions.__ Any scripts which provide implementations for
   extensions exposed by bundles are loaded, using Require.
   _Sources in `src/resolve`_
3. __Registering extensions.__ Resolved extensions are registered with Angular,
   such that they can be used by the application at run-time. This stage
   includes both registration of Angular built-ins (directives, controllers,
   routes, and services) as well as registration of non-Angular extensions.
   _Sources in `src/register`_
4. __Bootstrapping.__ JSON declarations are loaded for all bundles which
   will constitute the application, and wrapped in a useful API for subsequent
   stages. _Sources in `src/bootstrap`_

Additionally, the framework layer takes responsibility for initializing
other application state. Currently this simply means adding Promise to the
global namespace if it is not defined.

## Load stage

Using Angular's `$http`, the list of installed bundles is loaded from
`bundles.json`; then, each bundle's declaration (its path + `bundle.json`)
is loaded. These are wrapped by `Bundle` objects, and the extensions they
expose are wrapped by `Extension` objects; this is only to provide a
useful API for subsequent stages.

A bundle is a set of related extensions; an extension is an individual
unit of the application that is meant to be used by other pieces of the
application.

## Resolution stage

Some, but not all, individual extensions have corresponding scripts.
These are referred to by the `implementation` field in their extension
definition. The implementation name should not include the bundle path,
or the name of the source folder; these will be pre-pended by the framework
during this stage. The implementation name should include a `.js` extension.

An extension is resolved by loading its implementing script, if one has been
declared. If none is declared, the extension's raw definition is used
instead. To ensure that extensions look similar regardless of whether or
not an implementation is present, all key-value pairs from the definition
are copied to the loaded implementation (if one has been loaded.)

## Registration stage

Following implementation resolution, extensions are registered by Angular.
How this registration occurs depends on whether or not there is built in
support for the category of extension being registered.

* For _built-in_ extension types (recognized by Angular), these are
  registered with the application module. These categories are `directives`,
  `controllers`, `services`, and `routes`.
* For _composite services_, extensions of category `components` are passed
  to the service compositor, which builds up a dependency graph among
  the components such that their fully-wired whole is exposed as a single
  service.
* For _general extensions_, the resolved extensions are assembled into a
  list, with Angular-level dependencies are declared, and the full set
  is exposed as a single Angular "service."

### Composite services

Composite services are assumed to follow a provider-aggregator-decorator
pattern where:

* _Providers_ have dependencies as usual, and expose the API associated
  with the service they compose. Providers are full service implementations
  in-and-of-themselves.
* _Aggregators_ have dependencies as usual plus one additional dependency,
  which will be satisfied by the array of all providers registered of
  that type of service. Implementations are assumed to include an extra
  argument (after what they declare in `depends`) to receive this array.
  Aggregators make multiple providers appear as one.
* _Decorators_ have dependencies as usual plus one additional dependency,
  which will be satisfied by either an aggregator (if one is present),
  the latest provider (if no aggregator is present), or another decorator
  (if multiple decorators are present.) As with aggregators, an additional
  argument should be accepted by the implementation to receive this.
  Decorators modify or augment the behavior of a service, but do not
  provide its core functionality.
* All of the above must be declared with a `provides` property, which
  indicates which type of service they compose. Providers will only be
  paired with aggregators of matching types, and so on. The value of
  this property is also the name of the service that is ultimately
  registered with Angular to represent the composite service as a whole.

The service compositor handles this in five steps:

1. All providers are registered.
2. Arrays of providers are registered.
3. All aggregators are registered (with dependencies to the arrays
   registered in the previous step.)
4. All decorators are registered (with dependencies on the most recent
   components of matching types.)
5. Full composite services are registered (essentially aliasing back
   to the latest component registered of a given type.)

Throughout these steps, components are registered with Angular using
generated names like `typeService[decorator#11]`. It is technically possible
to reference these dependencies elsewhere but that is not the intent.
Rather, the resulting composed service should be referred to as
`typeService` (or, more generally, the value matched from the `provides`
field of the paired service components.)

### General extensions

Similar to composite services, each individual general extension gets
registered using a generated name, like `types[extension#0]`. These are
not intended to be referenced directly; instead, they are declared
dependencies of the full list of general extensions of a given category.
This list of extensions is registered with a square-brackets suffix,
like `types[]`; this _is_ intended to be declared as a dependency by
non-framework code.