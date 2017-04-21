# Building Applications With Open MCT

## Scope and purpose of this document

This document is intended to serve as a reference for developing an application 
based on Open MCT. It will provide details of the API functions necessary to extend the 
Open MCT platform meet common use cases such as integrating with a telemetry source. 

The best place to start is with the [Open MCT Tutorials](https://github.com/nasa/openmct-tutorial). 
These will walk you through the process of getting up and running with Open MCT, 
as well as addressing some common developer use cases.

## Building From Source 

The latest version of Open MCT is available from [our GitHub repository](https://github.com/nasa/openmct). 
If you have `git`, and `node` installed, you can build Open MCT with the commands 
```
git clone https://github.com/nasa/openmct.git
cd openmct
npm install
```

These commands will fetch the Open MCT source from our GitHub repository, and build 
a minified version that can be included in your application. The output of the 
build process is placed in a `dist` folder under the openmct source directory, 
which can be copied out to another location as needed. The contents of this 
folder will include a minified javascript file named `openmct.js` as well as 
assets such as html, css, and images necessary for the UI. 

## Starting an Open MCT application

To start a minimally functional Open MCT application, it is necessary to include 
the Open MCT distributable, enable some basic plugins, and bootstrap the application. 
The tutorials walk through the process of getting Open MCT up and running from scratch,
but provided below is a minimal HTML template that includes Open MCT, installs 
some basic plugins, and bootstraps the application. It assumes that Open MCT is 
installed under an `openmct` subdirectory, as described in [Building From Source](#building-from-source). 

This approach includes openmct using a simple script tag, resulting in a global 
variable named `openmct`. This `openmct` object is used subsequently to make API 
calls. 

Open MCT is packaged as a UMD (Universal Module Definition) module, so common 
script loaders are also supported.

```html
<!DOCTYPE html>
<html>
<head>
    <title>Open MCT</title>
    <script src="openmct.js"></script>
</head>
<body>
    <script>
        openmct.setAssetPath('openmct/dist');
        openmct.install(openmct.plugins.LocalStorage());
        openmct.install(openmct.plugins.MyItems());
        openmct.install(openmct.plugins.UTCTimeSystem());
        openmct.install(openmct.plugins.Espresso());
        openmct.start();
    </script>
</body>
</html>
```

The Open MCT library included above requires certain assets such as html templates, 
images, and css. If you installed Open MCT from GitHub as described in the section 
on [Building from Source](#building-from-source) then these assets will have been 
downloaded along with the Open MCT javascript library. You can specify the 
location of these assets by calling `openmct.setAssetPath()`. Typically this will 
be the same location as the `openmct.js` library is included from.

There are some plugins bundled with the application that provide UI, persistence, 
and other default configuration which are necessary to be able to do anything with 
the application initially. Any of these plugins can, in principle, be replaced with a custom 
plugin. The included plugins are documented in the [Included Plugins](#included-plugins) 
section.  

## Plugins

### Defining and Installing a New Plugin

```javascript
openmct.install(function install(openmctAPI) {
    // Do things here
    // ...
});
```

New plugins are installed in Open MCT by calling `openmct.install`, and providing 
a plugin installation function. This function will be invoked on application 
startup with one parameter - the openmct API object. A common approach used in 
the Open MCT codebase is to define a plugin as a function that returns this 
installation function. This allows configuration to be specified when the plugin is included.

eg.
```javascript
openmct.install(openmct.plugins.Elasticsearch("http://localhost:8002/openmct"));
```
This approach can be seen in all of the [plugins provided with Open MCT](https://github.com/nasa/openmct/blob/master/src/plugins/plugins.js).

## Domain Objects and Identifiers

_Domain Objects_ are the basic entities that represent domain knowledge in Open MCT.
The temperature sensor on a solar panel, an overlay plot comparing 
the results of all temperature sensors, the command dictionary for a spacecraft,
the individual commands in that dictionary, the "My Items" folder:
All of these things are domain objects.

A _Domain Object_ is simply a javascript object with some standard attributes.  
An example of a _Domain Object_ is the "My Items" object which is a folder in 
which a user can persist any objects that they create. The My Items object 
looks like this: 

```javascript
{
    identifier: {
        namespace: ""
        key: "mine"
    }
    name:"My Items",
    type:"folder",
    location:"ROOT",
    composition: []
}
```

### Object Attributes

The main attributes to note are the `identifier`, and `type` attributes.
* `identifier`: A composite key that provides a universally unique identifier for 
this object. The `namespace` and `key` are used to identify the object. The `key` 
must be unique within the namespace. 
* `type`: All objects in Open MCT have a type. Types allow you to form an 
ontology of knowledge and provide an abstraction for grouping, visualizing, and 
interpreting data. Details on how to define a new object type are provided below. 

Open MCT uses a number of builtin types. Typically you are going to want to 
define your own if extending Open MCT.

### Domain Object Types

Custom types may be registered via the `addType` function on the opencmt Type 
registry.

eg.
```javascript
openmct.types.addType('my-type', {
    label: "My Type",
    description: "This is a type that I added!",
    creatable: true
});
```

The `addType` function accepts two arguments:
* A `string` key identifying the type. This key is used when specifying a type 
for an object.
* An object type specification. An object type definition supports the following 
attributes      
    * `label`: a `string` naming this object type
    * `description`: a `string` specifying a longer-form description of this type
    * `initialize`: a `function` which initializes the model for new domain objects 
    of this type. This can be used for setting default values on an object when 
    it is instantiated.
    * `creatable`: A `boolean` indicating whether users should be allowed to create 
    this type (default: `false`). This will determine whether the type appears 
    in the `Create` menu.
    * `cssClass`: A `string` specifying a CSS class to apply to each representation 
    of this object. This is used for specifying an icon to appear next to each 
    object of this type.

The [Open MCT Tutorials](https://github.com/openmct/openmct-tutorial) provide a 
step-by-step examples of writing code for Open MCT that includes a [section on 
defining a new object type](https://github.com/nasa/openmct-tutorial#step-3---providing-objects).

## Root Objects

In many cases, you'd like a certain object (or a certain hierarchy of objects) 
to be accessible from the top level of the application (the tree on the left-hand 
side of Open MCT.) For example, it is typical to expose a telemetry dictionary 
as a hierarchy of telemetry-providing domain objects in this fashion.

To do so, use the `addRoot` method of the object API.

eg.
```javascript
openmct.objects.addRoot({
        namespace: "my-namespace",
        key: "my-key"
    });
```

The `addRoot` function takes a single [object identifier](#domain-objects-and-identifiers) 
as an argument. 

Root objects are loaded just like any other objects, i.e. via an object
provider.

## Object Providers

An Object Provider is used to build _Domain Objects_, typically retrieved from 
some source such as a persistence store or telemetry dictionary. In order to 
integrate telemetry from a new source an object provider will need to be created 
that can build objects representing telemetry points exposed by the telemetry 
source. The API call to define a new object provider is fairly straightforward. 
Here's a very simple example:

```javascript
openmct.objects.addProvider('example.namespace', {
    get: function (identifier) {
        return Promise.resolve({
            identifier: identifier,
            name: 'Example Object',
            type: 'example-object-type'
        });
    }
});
```
The `addProvider` function takes two arguments:

* `namespace`: A `string` representing the namespace that this object provider 
will provide objects for.
* `provider`: An `object` with a single function, `get`. This function accepts an 
[Identifier](#domain-objects-and-identifiers) for the object to be provided. 
It is expected that the `get` function will return a 
[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
that resolves with the object being requested.

In future, object providers will support other methods to enable other operations 
with persistence stores, such as creating, updating, and deleting objects.

## Composition Providers

The _composition_ of a domain object is the list of objects it contains, as shown 
(for example) in the tree for browsing. Open MCT provides a
[default solution](#default-composition-provider) for composition, but there
may be cases where you want to provide the composition of a certain object
(or type of object) dynamically.

### Adding Composition Providers

You may want to populate a hierarchy under a custom root-level object based on 
the contents of a telemetry dictionary. To do this, you can add a new 
Composition Provider:

```javascript
openmct.composition.addProvider({
    appliesTo: function (domainObject) {
        return domainObject.type === 'my-type';
    },
    load: function (domainObject) {
        return Promise.resolve(myDomainObjects);
    }
});
```
The `addProvider` function accepts a Composition Provider object as its sole 
argument. A Composition Provider is a javascript object exposing two functions:
* `appliesTo`: A `function` that accepts a `domainObject` argument, and returns 
a `boolean` value indicating whether this composition provider applies to the 
given object.
* `load`: A `function` that accepts a `domainObject` as an argument, and returns
a `Promise` that resolves with an array of [Identifier](#domain-objects-and-identifiers).
These identifiers will be used to fetch Domain Objects from an [Object Provider](#object-provider)

### Default Composition Provider

The default composition provider applies to any domain object with a `composition` 
property. The value of `composition` should be an array of identifiers, e.g.:

```javascript
var domainObject = {
    name: "My Object",
    type: 'folder',
    composition: [
        {
            id: '412229c3-922c-444b-8624-736d85516247',
            namespace: 'foo'
        },
        {
            key: 'd6e0ce02-5b85-4e55-8006-a8a505b64c75',
            namespace: 'foo'
        }
    ]
};
```

## Telemetry Providers

When connecting to a new telemetry source, you will need to register a new
_Telemetry Provider_. A _Telemetry Provider_ retrieves telemetry data from some telemetry 
source, and exposes them in a way that can be used by Open MCT. A telemetry 
provider typically can support a one off __request__ for a batch of telemetry data, 
or it can provide the ability to __subscribe__ to receive new telemetry data when 
it becomes available, or both.

```javascript
openmct.telemetry.addProvider({
    supportsRequest: function (domainObject) {
        //...
    },
    supportsSubscribe: function (domainObject) {
        //...
    },
    request: function (domainObject, options) {    
        //...
    },
    subscribe: function (domainObject, callback, options) {
        //...
    }
})
```

A telemetry provider is an object with the following functions defined:

* `supportsRequest`: An __optional__ `function` that accepts a 
[Domain Object](#domain-objects-and-identifiers) and returns a `boolean` value
indicating whether or not this provider supports telemetry requests for the 
given object. If this returns `true` then a `request` function must be defined. 
* `supportsSubscribe`: An __optional__ `function` that accepts a 
[Domain Object](#domain-objects-and-identifiers) and returns a `boolean` value 
indicating whether or not this provider supports telemetry subscriptions. If this 
returns `true` then a `subscribe` function must also be defined. As with `request`, 
the return value will typically be conditional, and based on attributes of 
`domainObject` such as its identifier.
* `request`: A `function` that returns a `Promise` that will resolve with an `Array` 
of telemetry in a single query. This function accepts as arguments a 
[Domain Object](#domain-objects-and-identifiers) and an object containing some 
[request options](#telemetry-requests). 
* `subscribe`:  A `function` that accepts a [Domain Object](#domain-objects-and-identifiers),
a callback `function`, and a [telemetry request](#telemetry-requests). The 
callback is invoked whenever telemetry is available, and 


The implementations for `request` and `subscribe` can vary depending on the
nature of the endpoint which will provide telemetry. In the example above,
it is assumed that `myAdapter` contains the implementation details
(such as HTTP requests, WebSocket connections, etc.) associated with some telemetry
source.

For a step-by-step guide to building a telemetry adapter, please see the 
[Open MCT Tutorials](https://github.com/larkin/openmct-tutorial).

### Telemetry Requests
Telemetry requests support time bounded queries. A call to a _Telemetry Provider_'s 
`request` function will include an `options` argument. These are simply javascript
objects with attributes for the request parameters. An example of a telemetry 
request object with a start and end time is included below:
```javascript
{
    start: 1487981997240,
    end: 1487982897240
}
```

### Telemetry Data

Telemetry data is provided to Open MCT by _[Telemetry Providers](#telemetry-providers)_
in the form of javascript objects. A collection of telemetry values (for example, 
retrieved in response to a `request`) is represented by an `Array` of javascript 
objects. These telemetry javascript objects are simply key value pairs.

Typically a telemetry datum will have some timestamp associated with it. This 
time stamp should have a key that corresponds to some time system supported by 
Open MCT. If the `UTCTimeSystem` plugin is installed, then the key `utc` can be used.
   
An example of a telemetry provider request function that returns a collection of
mock telemtry data is below:

```javascript
openmct.telemetry.addProvider({
    supportsRequest: function (domainObject) {
        return true
    },
    request: function (domainObject, options) {    
        return Promise.resolve([
            {
                'utc': Date.now() - 2000,
                'value': 1,
            },
            {
                'utc': Date.now() - 1000,
                'value': 2,
            },
            {
                'utc': Date.now(),
                'value': 3,
            }
        ]);
    }
})
```

## Included Plugins

Open MCT is packaged along with a few general-purpose plugins:

* `openmct.plugins.CouchDB` is an adapter for using CouchDB for persistence
  of user-created objects. This is a constructor that takes the URL for the
  CouchDB database as a parameter, e.g.
```javascript
openmct.install(openmct.plugins.CouchDB('http://localhost:5984/openmct'))
```
* `openmct.plugins.Elasticsearch` is an adapter for using Elasticsearch for
  persistence of user-created objects. This is a
  constructor that takes the URL for the Elasticsearch instance as a
  parameter. eg.
```javascript
openmct.install(openmct.plugins.CouchDB('http://localhost:9200'))
```
* `openmct.plugins.Espresso` and `openmct.plugins.Snow` are two different
  themes (dark and light) available for Open MCT. Note that at least one
  of these themes must be installed for Open MCT to appear correctly.
* `openmct.plugins.LocalStorage` provides persistence of user-created
  objects in browser-local storage. This is particularly useful in
  development environments.
* `openmct.plugins.MyItems` adds a top-level folder named "My Items"
  when the application is first started, providing a place for a
  user to store created items.
* `openmct.plugins.UTCTimeSystem` provides a default time system for Open MCT.

Generally, you will want to either install these plugins, or install
different plugins that provide persistence and an initial folder
hierarchy.

eg.
```javascript
openmct.install(openmct.plugins.LocalStorage());
openmct.install(openmct.plugins.MyItems());
```
