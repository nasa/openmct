# Object API - Overview

The object API provides methods for fetching domain objects.

# Keys
Keys are a composite identifier that is used to create and persist objects.  Ex:
```javascript
{
    namespace: 'elastic',
    identifier: 'myIdentifier'
}
```

In old MCT days, we called this an "id", and we encoded it in a single string.  
The above key would encode into the identifier, `elastic:myIdentifier`.

When interacting with the API you will be dealing with key objects.

## Roots

"Roots" are objects that Open MCT will load at run time and form the basic entry point for users.  You can register new root objects by calling the 

# Configuring the Object API

The following methods should be used before calling run.  They allow you to 
configure the persistence space of MCT.

* `MCT.objects.addRoot(key)` -- add a "ROOT" to Open MCT by specifying it's key.
* `MCT.objects.removeRoot(key)` -- Remove a "ROOT" from Open MCT by key.
* `MCT.objects.addProvider(namespace, provider)` -- register an object provider for a specific namespace.  See below for documentation on the provider interface.

# defining providers

# Using the object API

The object API provides methods for getting, saving, and deleting objects.  Plugin developers may not frequently need to interact with this API, as they should receive instances of the objects as needed.

* MCT.objects.get(key) -> returns promise for an object
* MCT.objects.save(object) -> returns promise that is resolved when object has been saved
* MCT.objects.delete(object) -> returns promise that is resolved when object has been deleted

## Configuration Example: Adding a groot

See the tutorial in [object-provider.html](object-provider.html).

### Making a custom provider:

All methods on the provider interface are optional. 

* `provider.get(key)` -> returns promise for a domain object.
* `provider.save(domainObject)` -> returns promise that is fulfilled when object has been saved.
* `provider.delete(domainObject)` -> returns promise that is fulfilled when object has been deleted.


