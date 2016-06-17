# Composition API - Overview

The composition API is straightforward:

MCT.composition(object) -- returns a `CompositionCollection` if the object has 
composition, returns undefined if it doesn't.

## CompositionCollection

Has three events:
* `load`: when the collection has completed loading.
* `add`: when a new object has been added to the collection.
* `remove` when an object has been removed from the collection.

Has three methods:

`Collection.load()` -- returns a promise that is fulfilled when the composition 
    has loaded.
`Collection.add(object)` -- add a domain object to the composition.
`Collection.remove(object)` -- remove the object from the composition.

## Composition providers
composition providers are anything that meets the following interface:

* `provider.appliesTo(domainObject)` -> return true if this provider can provide 
    composition for a given domain object.
* `provider.add(domainObject, childObject)` -> adds object 
* `provider.remove(domainObject, childObject)` -> immediately removes objects
* `provider.load(domainObject)` -> returns promise for array of children

There is a default composition provider which handles loading composition for 
any object with a `composition` property.  If you want specialized composition 
loading behavior, implement your own composition provider and register it with

`MCT.composition.addProvider(myProvider)`
