/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Utility function for creating getter-setter functions,
         * since these are frequently useful for element proxies.
         *
         * An optional third argument may be supplied in order to
         * constrain or modify arguments when using as a setter;
         * this argument is a function which takes two arguments
         * (the current value for the property, and the requested
         * new value.) This is useful when values need to be kept
         * in certain ranges; specifically, to keep x/y positions
         * non-negative in a fixed position view.
         *
         * @constructor
         * @param {Object} object the object to get/set values upon
         * @param {string} key the property to get/set
         * @param {function} [updater] function used to process updates
         */
        function AccessorMutator(object, key, updater) {
            return function (value) {
                if (arguments.length > 0) {
                    object[key] = updater ?
                            updater(value, object[key]) :
                            value;
                }
                return object[key];
            };
        }

        return AccessorMutator;
    }
);