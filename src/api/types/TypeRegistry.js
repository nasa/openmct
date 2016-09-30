
define([], function () {

    /**
     * A TypeRegistry maintains the definitions for different types
     * that domain objects may have.
     * @interface TypeRegistry
     * @memberof module:openmct
     */
    function TypeRegistry() {
        this.types = {};
    }

    /**
     * Register a new type of view.
     *
     * @param {string} typeKey a string identifier for this type
     * @param {module:openmct.Type} type the type to add
     * @method addProvider
     * @memberof module:openmct.TypeRegistry#
     */
    TypeRegistry.prototype.addType = function (typeKey, type) {
        this.types[typeKey] = type;
    };


    return TypeRegistry;
});


