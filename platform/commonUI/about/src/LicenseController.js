/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Provides extension-introduced licenses information to the
         * licenses route.
         * @constructor
         */
        function LicenseController(licenses) {
            return {
                /**
                 * Get license information.
                 * @returns {Array} license extensions
                 */
                licenses: function () {
                    return licenses;
                }
            };
        }

        return LicenseController;
    }
);