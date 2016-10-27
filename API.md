# Open MCT API

The Open MCT framework public api can be utilized by building the application
(`gulp install`) and then copying the file from `dist/main.js` to your
directory of choice.

Open MCT supports AMD, CommonJS, and loading via a script tag; it's easy to use
in your project. The [`openmct`]{@link module:openmct} module is exported
via AMD and CommonJS, and is also exposed as `openmct` in the global scope
if loaded via a script tag.

## Overview

Open MCT's goal is to allow you to browse, create, edit, and visualize all of
the domain knowledge you need on a daily basis.

To do this, the main building block provided by Open MCT is the _domain object_.
The temperature sensor on the starboard solar panel,
an overlay plot comparing the results of all temperature sensor,
the command dictionary for a spacecraft,
the individual commands in that dictionary, your "my documents" folder:
All of these things are domain objects.

Domain objects have Types, so a specific instrument temperature sensor is a
"Telemetry Point," and turning on a drill for a certain duration of time is
an "Activity".  Types allow you to form an ontology of knowledge and provide
an abstraction for grouping, visualizing, and interpreting data.

And then we have Views. Views allow you to visualize domain objects. Views can
apply to specific domain objects; they may also apply to certain types of
domain objects, or they may apply to everything.  Views are simply a method
of visualizing domain objects.

Regions allow you to specify what views are displayed for specific types of
domain objects in response to different user actions. For instance, you may
want to display a different view while editing, or you may want to update the
toolbar display when objects are selected.  Regions allow you to map views to
specific user actions.

Domain objects can be mutated and persisted, developers can create custom
actions and apply them to domain objects, and many more things can be done.
For more information, read on!

## Running Open MCT

Once the [`openmct`](@link module:openmct) module has been loaded, you can
simply invoke [`start`]{@link module:openmct.MCT#start} to run Open MCT:


```
openmct.start();
```

Generally, however, you will want to configure Open MCT by adding plugins
before starting it. It is important to install plugins and configure Open MCT
_before_ calling [`start`]{@link module:openmct.MCT#start}; Open MCT is not
designed to be reconfigured once started.

## Configuring Open MCT

The [`openmct`]{@link module:openmct} module (more specifically, the
[`MCT`]{@link module:openmct.MCT} class, of which `openmct` is an instance)
exposes a variety of methods to allow the application to be configured,
extended, and customized before running.

Short examples follow; see the linked documentation for further details.

### Adding Domain Object Types

Custom types may be registered via
[`openmct.types`]{@link module:openmct.MCT#types}:

```
openmct.types.addType('my-type', new openmct.Type({
    label: "My Type",
    description: "This is a type that I added!",
    creatable: true
});
```

### Adding Views

Custom views may be registered based on the region in the application
where they should appear:

* [`openmct.mainViews`]{@link module:openmct.MCT#mainViews} is a registry
  of views of domain objects which should appear in the main viewing area.
* [`openmct.inspectors`]{@link module:openmct.MCT#inspectors} is a registry
  of views of domain objects and/or active selections, which should appear in
  the Inspector.
* [`openmct.toolbars`]{@link module:openmct.MCT#toolbars} is a registry
  of views of domain objects and/or active selections, which should appear in
  the toolbar area while editing.
* [`openmct.indicators`]{@link module:openmct.MCT#inspectors} is a registry
  of views which should appear in the status area of the application.

Example:

```
openmct.mainViews.addProvider({
    canView: function (domainObject) {
        return domainObject.type === 'my-type';
    },
    view: function (domainObject) {
        return new MyView(domainObject);
    }
});
```

### Adding a Root-level Object

In many cases, you'd like a certain object (or a certain hierarchy of
objects) to be accessible from the top level of the application (the
tree on the left-hand side of Open MCT.) It is typical to expose a telemetry
dictionary as a hierarchy of telemetry-providing domain objects in this
fashion.

To do so, use the [`addRoot`]{@link module:openmct.ObjectAPI#addRoot} method
of the [object API]{@link module:openmct.ObjectAPI}:

```
openmct.objects.addRoot({ key: "my-key", namespace: "my-namespace" });
```

Root objects are loaded just like any other objects, i.e. via an object
provider.

### Adding Composition Providers

The "composition" of a domain object is the list of objects it contains,
as shown (for example) in the tree for browsing. Open MCT provides a
default solution for composition, but there may be cases where you want
to provide the composition of a certain object (or type of object) dynamically.
For instance, you may want to populate a hierarchy under a custom root-level
object based on the contents of a telemetry dictionary.
To do this, you can add a new CompositionProvider:

```
openmct.composition.addProvider({
    appliesTo: function (domainObject) {
        return domainObject.type === 'my-type';
    },
    load: function (domainObject) {
        return Promise.resolve(myDomainObjects);
    }
});
```

### Adding Telemetry Providers

When connecting to a new telemetry source, you will want to register a new
[telemetry provider]{@link module:openmct.TelemetryAPI~TelemetryProvider}
with the [telemetry API]{@link module:openmct.TelemetryAPI#addProvider}:

```
openmct.telemetry.addProvider({
    canProvideTelemetry: function (domainObject) {
        return domainObject.type === 'my-type';
    },
    properties: function (domainObject) {
        return [
            { key: 'value', name: "Temperature", units: "degC" },
            { key: 'time', name: "UTC" }
        ];
    },
    request: function (domainObject, options) {
        var telemetryId = domainObject.myTelemetryId;
        return myAdapter.request(telemetryId, options.start, options.end);
    },
    subscribe: function (domainObject, callback) {
        var telemetryId = domainObject.myTelemetryId;
        myAdapter.subscribe(telemetryId, callback);
        return myAdapter.unsubscribe.bind(myAdapter, telemetryId, callback);
    }
});
```

The implementations for `request` and `subscribe` can vary depending on the
nature of the endpoint which will provide telemetry. In the example above,
it is assumed that `myAdapter` contains the specific implementations
(HTTP requests, WebSocket connections, etc.) associated with some telemetry
source.

## Using Open MCT

When implementing new features, it is useful and sometimes necessary to
utilize functionality exposed by Open MCT.

### Retrieving Composition

To limit which objects are loaded at any given time, the composition of
a domain object must be requested asynchronously:

```
openmct.composition(myObject).load().then(function (childObjects) {
    childObjects.forEach(doSomething);
});
```

### Support Common Gestures

Custom views may also want to support common gestures using the
[gesture API]{@link module:openmct.GestureAPI}. For instance, to make
a view (or part of a view) selectable:

```
openmct.gestures.selectable(myHtmlElement, myDomainObject);
```

### Working with Domain Objects

The [object API]{@link module:openmct.ObjectAPI} provides useful methods
for working with domain objects.

To make changes to a domain object, use the
[`mutate`]{@link module:openmct.ObjectAPI#mutate} method:

```
openmct.objects.mutate(myDomainObject, "name", "New name!");
```

Making modifications in this fashion allows other usages of the domain
object to remain up to date using the
[`observe`]{@link module:openmct.ObjectAPI#observe} method:

```
openmct.objects.observe(myDomainObject, "name", function (newName) {
    myLabel.textContent = newName;
});
```

### Using Telemetry

Very often in Open MCT, you wish to work with telemetry data (for instance,
to display it in a custom visualization.)


### Synchronizing with the Time Conductor

Views which wish to remain synchronized with the state of Open MCT's
time conductor should utilize
[`openmct.conductor`]{@link module:openmct.TimeConductor}:

```
openmct.conductor.on('bounds', function (newBounds) {
    requestTelemetry(newBounds.start, newBounds.end).then(displayTelemetry);
});
```

## Plugins

While you can register new features with Open MCT directly, it is generally
more useful to package these as a plugin. A plugin is a function that takes
[`openmct`]{@link module:openmct} as an argument, and performs configuration
upon `openmct` when invoked.

### Installing Plugins

To install plugins, use the [`install`]{@link module:openmct.MCT#install}
method:

```
openmct.install(myPlugin);
```

The plugin will be invoked to configure Open MCT before it is started.

### Writing Plugins

Plugins configure Open MCT, and should utilize the
[`openmct`]{@link module:openmct} module to do so, as summarized above in
"Configuring Open MCT" and "Using Open MCT" above.

### Distributing Plugins

Hosting or downloading plugins is outside of the scope of this documentation.
We recommend distributing plugins as UMD modules which export a single
function.

