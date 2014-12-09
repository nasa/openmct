/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The CompositeController supports the "composite" control type,
         * which provides an array of other controls. It is used specifically
         * to support validation when a particular row is not marked as
         * required; in this case, empty input should be allowed, but partial
         * input (where some but not all of the composite controls have been
         * filled in) should be disallowed. This is enforced in the template
         * by an ng-required directive, but that is supported by the
         * isNonEmpty check that this controller provides.
         * @constructor
         */
        function CompositeController() {
            // Check if an element is defined; the map step of isNonEmpty
            function isDefined(element) {
                return typeof element !== 'undefined';
            }

            // Boolean or; the reduce step of isNonEmpty
            function or(a, b) {
                return a || b;
            }

            return {
                /**
                 * Check if an array contains anything other than
                 * undefined elements.
                 * @param {Array} value the array to check
                 * @returns {boolean} true if any non-undefined
                 *          element is in the array
                 */
                isNonEmpty: function (value) {
                    return Array.isArray(value) &&
                        value.map(isDefined).reduce(or, false);
                }
            };
        }

        return CompositeController;

    }
);