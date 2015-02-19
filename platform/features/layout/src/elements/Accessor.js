/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Utility function for creating getter-setter functions,
         * since these are frequently useful for element proxies.
         * @constructor
         * @param {Object} object the object to get/set values upon
         * @param {string} key the property to get/set
         */
        function Accessor(object, key) {
            return function (value) {
                if (arguments.length > 0) {
                    object[key] = value;
                }
                return object[key];
            };
        }

        return Accessor;
    }
);