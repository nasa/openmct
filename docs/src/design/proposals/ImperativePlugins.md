# Imperative Plugins

This is a design proposal for handling
[bundle declarations in JavaScript](
APIRedesign.md#bundle-declarations-in-javascript).

## Developer Use Cases

Developers will want to use bundles/plugins to (in rough order
of occurrence):

1. Add new extension instances.
2. Add new service implementations.
3. Decorate service implementations.
4. Add new types of services.
5. Add new extension categories.

Notably, bullets 4 and 5 above are currently handled implicitly,
which has been cited as a source of confusion.

## Interfaces

```javascript

/**
 * Something that can be installed in a running instance of MCT.
 * @interface Installable
 */

/**
 * Install this plugin in an instance of MCT.
 * @method Installable#install
 * @param mct the instance of MCT in which to install
 */

/**
 * A bundle is a set of related features that can
 * be installed in MCT.
 * @class
 * @implements {Installable}
 * @param {Metadata} metadata metadata about this bundle
 */
function Bundle(metadata) {
    this.metadata = metadata;
}

Bundle.prototype.service
Bundle.prototype.install = function (mct) {};

/**
 * Data about a given entity within the system.
 * @typedef Metadata
 * @property {string} name the human-readable name of the entity
 * @property {string} key the machine-readable identifier for the entity
 * @property {string} description a human-readable summary of the entity
 */


[Dependency<T> |
    get() : T
]

[Registry<T> |
    register(
        dependencies : Dependency[],
        factory : Function<T>
    )
]

[ExtensionRegistry<T> |
]

[ExtensionRegistry]

```

Creating a bundle then looks like:

```javascript
define([
    'mct',
    './SomeExtension',
    './SomeService'
], function (mct, SomeExtension, SomeService) {
    var plugin = new mct.Bundle({
        key: 'myBundle',
        name: "My bundle",
        description: "A bundle that I made."
    });

    plugin.extension

    return plugin;
});

```
