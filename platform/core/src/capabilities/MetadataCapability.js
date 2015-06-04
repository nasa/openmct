/*global define*/

define(
    ['moment'],
    function (moment) {
        "use strict";

        /**
         * A piece of information about a domain object.
         * @typedef {Object} MetadataProperty
         * @property {string} name the human-readable name of this property
         * @property {string} value the human-readable value of this property,
         *           for this specific domain object
         */

        var TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

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
            var model = domainObject.getModel();

            function hasDisplayableValue(metadataProperty) {
                var t = typeof metadataProperty.value;
                return (t === 'string' || t === 'number');
            }

            function formatTimestamp(timestamp) {
                return typeof timestamp === 'number' ?
                        (moment.utc(timestamp).format(TIME_FORMAT) + " UTC") :
                        undefined;
            }

            function getProperties() {
                var type = domainObject.getCapability('type');

                function lookupProperty(typeProperty) {
                    return {
                        name: typeProperty.getDefinition().name,
                        value: typeProperty.getValue(model)
                    };
                }

                return (type ? type.getProperties() : []).map(lookupProperty);
            }

            function getCommonMetadata() {
                return [
                    {
                        name: "Updated",
                        value: formatTimestamp(model.modified)
                    },
                    {
                        name: "ID",
                        value: domainObject.getId()
                    }
                ];
            }

            function getMetadata() {
                return getProperties().concat(getCommonMetadata())
                    .filter(hasDisplayableValue);
            }

            return {
                /**
                 * Get metadata about this object.
                 * @returns {MetadataProperty[]} metadata about this object
                 */
                invoke: getMetadata
            };
        }

        return MetadataCapability;
    }
);
