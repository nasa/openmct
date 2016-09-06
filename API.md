# Open MCT API

The Open MCT framework public api can be utilized by building the application (`gulp install`) and then copying the file from `dist/main.js` to your directory
of choice.

Open MCT supports AMD, CommonJS, and loading via a script tag; it's easy to use
in your project. The [`openmct`]{@link module:openmct} module is exported
via AMD and CommonJS, and is also exposed as `openmct` in the global scope
if loaded via a script tag.

## Overview

Open MCT's goal is to allow you to browse, create, edit, and visualize all of the domain knowledge you need on a daily basis.  

To do this, the main building block provided by Open MCT is the domain object-- the temperature sensor on the starboard solar panel, an overlay plot comparing the results of all temperature sensor, the command dictionary for a spacecraft, the individual commands in that dictionary, your "my documents" folder: all of these things are domain objects. 

Domain objects have Types-- so a specific instrument temperature sensor is a "Telemetry Point," and turning on a drill for a certain duration of time is an "Activity".  Types allow you to form an ontology of knowledge and provide an abstraction for grouping, visualizing, and interpreting data.

And then we have Views.  Views allow you to visualize a domain object.  Views can apply to specific domain objects; they may also apply to certain types of domain objects, or they may apply to everything.  Views are simply a method of visualizing domain objects.

Regions allow you to specify what views are displayed for specific types of domain objects in response to different user actions-- for instance, you may want to display a different view while editing, or you may want to update the toolbar display when objects are selected.  Regions allow you to map views to specific user actions.

Domain objects can be mutated and persisted, developers can create custom actions and apply them to domain objects, and many more things can be done.  For more information, read on.

## The API

### `MCT.Type(options)`
Status: First Draft

Returns a `typeInstance`.  `options` is an object supporting the following properties:

* `metadata`: `object` defining metadata used in displaying the object; has the following properties:
  * `label`: `string`, the human-readible name of the type.  used in menus and inspector.
  * `glyph`: `string`, the name of the icon to display for this type, used in labels.
  * `description`: `string`, a human readible description of the object and what it is for.
* `initialize`: `function` which initializes new instances of this type.  it is called with an object, should add any default properties to that object.
* `creatable`: `boolean`, if true, this object will be visible in the create menu.
* `form`: `Array` an array of form fields, as defined... somewhere!  Generates a property sheet that is visible while editing this object.

### `MCT.type(typeKey, typeInstance)`
Status: First Draft

Register a `typeInstance` with a given Type `key` (a `string`).  There can only be one `typeInstance` registered per type `key`.  typeInstances must be registered before they can be utilized.

### `MCT.Objects`
Status: First Draft

Allows you to register object providers, which allows you to integrate domain objects from various different sources.  Also implements methods for mutation and persistence of objects.  See [Object API](src/api/objects/README.md) for more details.

### `MCT.Composition`
Status: First Draft

Objects can contain other objects, and the Composition API allows you to fetch the composition of any given domain object, or implement custom methods for defining composition as necessary.  

### `MCT.view(region, definition)`
Status: First Draft

Register a view factory for a specific region.  View factories receive an instance of a domain object and return a `View` for that object, or return undefined if they do not know how to generate a view for that object.

* `ViewDefinition`: an object with the following properties:
    * `canView(domainObject)`: should return truthy if the view is valid for a given domain object, falsy if it is not capable of generating a view for that object.
    * `view(domainObject)`: should instantate and return a `View` for the given object.
    * `metadata()`: a function that returns metadata about this view.  Optional.
* `View`: an object containing a number of lifecycle methods:
    * `view.show(container)`:  instantiate a view (a set of dom elements) and attach it to the container.
    * `view.destroy(container)`:  remove any listeners and expect your dom elements to be destroyed.
    
For a basic introduction to views & types, check out these tutorials: 

* [custom-view](custom-view.html) -- Implementing a custom view with vanilla javascript.
* [custom-view-react](custom-view-react.html) -- Implementing a custom view with React.

### `MCT.conductor`
Status: First Draft

The time conductor is an API that facilitates time synchronization across multiple components.  Components that would like to be "time aware" may attach listeners to the time conductor API to allow them to remain synchronized with other components.  For more information ont he time conductor API, please look at the API draft here: https://github.com/nasa/openmct/blob/66220b89ca568075f107505ba414de9457dc0427/platform/features/conductor-redux/src/README.md

### `MCT.selection`
Status: First Draft

Tracks the application's selection state (which elements of a view has a user selected?)

One or more JavaScript objects may be selected at any given time. User code is responsible for any necessary type-checking.

The following methods are exposed from this object:

* `select(value)`: Add `value` to the current selection.
* `deselect(value)`: Remove `value` from the current selection.
* `selected()`: Get array of all selected objects.
* `clear()`: Deselect all selected objects.

MCT.selection is an EventEmitter; a `change` event is emitted whenever the selection changes.

### `MCT.systems`
Status: Not Implemented, Needs to be ported from old system.

A registry for different time system definitions.  Based upon the previous time format system which utilized the "formats" extension category.  

### `MCT.run([container])`
Status: Stable Draft

Run the MCT application, loading the application into the `container`, a DOM element.  If a container is not specified, the application is injected into the body of the page.

### `MCT.install(plugin)`
Status: Stable Draft

Install a plugin in MCT.  Must be called before calling `run`.  Plugins are functions which are invoked with the `MCT` instance as their first argument, and are expected to use the MCT public API to add functionality.

For an example of writing a plugin, check out [plugin-example.html](plugin-example.html)

### `MCT.setAssetPath(path)`

Sets the path (absolute or relative) at which the Open MCT static files are being hosted.  The default value is '.'.  

Note that this API is transitional and will be removed in a future version.

