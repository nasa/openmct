/*global define*/

/**
 * Type property. Defines a mutable or displayable property
 * associated with objects of a given type.
 *
 * @module core/type/type-property
 */
define(
    ['./TypePropertyConversion'],
    function (TypePropertyConversion) {
        'use strict';

        /**
         * Instantiate a property associated with domain objects of a
         * given type. This provides an interface by which
         *
         * @constructor
         * @memberof module:core/type/type-property
         */
        function TypeProperty(propertyDefinition) {
            // Load an appropriate conversion
            var conversion = new TypePropertyConversion(
                propertyDefinition.conversion || "identity"
            );

            // Perform a lookup for a value from an object,
            // which may recursively look at contained objects
            // based on the path provided.
            function lookupValue(object, propertyPath) {
                var value;

                // Can't look up from a non-object
                if (!object) {
                    return undefined;
                }

                // If path is not an array, just look up the property
                if (!Array.isArray(propertyPath)) {
                    return object[propertyPath];
                }

                // Otherwise, look up in the sequence defined in the array
                if (propertyPath.length > 0) {
                    value = object[propertyPath[0]];
                    return propertyPath.length > 1 ?
                            lookupValue(value, propertyPath.slice(1)) :
                            value;
                } else {
                    return undefined;
                }
            }

            function specifyValue(object, propertyPath, value) {

                // If path is not an array, just set the property
                if (!Array.isArray(propertyPath)) {
                    object[propertyPath] = value;
                } else if (propertyPath.length > 1) {
                    // Otherwise, look up in defined sequence
                    object[propertyPath[0]] = object[propertyPath[0]] || {};
                    specifyValue(
                        object[propertyPath[0]],
                        propertyPath.slice(1),
                        value
                    );
                } else if (propertyPath.length === 1) {
                    object[propertyPath[0]] = value;
                }

            }

            return {
                /**
                 * Retrieve the value associated with this property
                 * from a given model.
                 */
                getValue: function (model) {
                    var property = propertyDefinition.property ||
                        propertyDefinition.key;

                    if (property) {
                        return conversion.toFormValue(
                            lookupValue(model, property)
                        );
                    } else {
                        return undefined;
                    }
                },
                /**
                 * Set a value associated with this property in
                 * an object's model.
                 */
                setValue: function setValue(model, value) {
                    var property = propertyDefinition.property ||
                        propertyDefinition.key;

                    value = conversion.toModelValue(value);

                    if (property) {
                        return specifyValue(model, property, value);
                    } else {
                        return undefined;
                    }
                },
                /**
                 * Get the raw definition for this property.
                 */
                getDefinition: function () {
                    return propertyDefinition;
                }
            };
        }

        return TypeProperty;
    }
);