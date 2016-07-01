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

# Configuring the Object API

The following methods should be used before calling run.  They allow you to 
configure the persistence space of MCT.

* `MCT.objects.addRoot(key)` -- add a "ROOT" to Open MCT by specifying it's 
    key.
* `MCT.objects.removeRoot(key)` -- Remove a "ROOT" from Open MCT by key.
* `MCT.objects.addProvider(namespace, provider)` -- register an object provider
    for a specific namespace.  See below for documentation on the provider 
    interface.
    
# Using the object API

The object API provides methods for getting, saving, and deleting objects.

* MCT.objects.get(key) -> returns promise for an object
* MCT.objects.save(object) -> returns promise that is resolved when object
    has been saved
* MCT.objects.delete(object) -> returns promise that is resolved when object has 
    been deleted

## Configuration Example: Adding a groot

The following example adds a new root object for groot and populates it with
some pieces of groot.

```javascript

var ROOT_KEY = {
    namespace: 'groot',
    identifier: 'groot'
};

var GROOT_ROOT = {
    name: 'I am groot',
    type: 'folder',
    composition: [
        {
            namespace: 'groot',
            identifier: 'arms'
        },
        {
            namespace: 'groot',
            identifier: 'legs'
        },
        {
            namespace: 'groot',
            identifier: 'torso'
        }
    ]
};

var GrootProvider = {
    get: function (key) {
        if (key.identifier === 'groot') {
            return Promise.resolve(GROOT_ROOT);
        }
        return Promise.resolve({
            name: 'Groot\'s ' + key.identifier
        });
    }
};

mct.Objects.addRoot(ROOT_KEY);

mct.Objects.addProvider('groot', GrootProvider);

```

### Making a custom provider:

All methods on the provider interface are optional, so you do not need
to modify them.

* `provider.get(key)` -> promise for a domain object.
* `provider.save(domainObject)` -> returns promise that is fulfilled when object 
    has been saved.
* `provider.delete(domainObject)` -> returns promise that is fulfilled when 
    object has been deleted.


