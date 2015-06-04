/*global define*/

define(
    function () {
        "use strict";

        /**
         * A piece of information about a domain object.
         * @typedef {Object} MetadataProperty
         * @property {string} name the human-readable name of this property
         * @property {string} value the human-readable value of this property,
         *           for this specific domain object
         */

        /**
         * Implements the `metadata` capability of a domain object, providing
         * properties of that object for display.
         *
         * Usage: `domainObject.useCapability("metadata")`
         *
         * ...which will return an array of objects containing `name` and
         * `value` properties describing that domain object (suitable for
         * display.)
         *
         * @constructor
         */
        function MetadataCapability(domainObject) {
            return {
                /**
                 * Get metadata about this object.
                 * @returns {MetadataProperty[]} metadata about this object
                 */
                invoke: function () {
                    var type = domainObject.getCapability('type'),
                        model = domainObject.getModel(),
                        metadata = [{
                            name: "ID",
                            value: domainObject.getId()
                        }];

                    function addProperty(typeProperty) {
                        var name = typeProperty.getDefinition().name,
                            value = typeProperty.getValue(model);
                        if (typeof value === 'string' ||
                                typeof value === 'number') {
                            metadata.push({
                                name: name,
                                value: value
                            });
                        }
                    }

                    (type ? type.getProperties() : []).forEach(addProperty);

                    return metadata;
                }
            };
        }

        return MetadataCapability;
    }
);
