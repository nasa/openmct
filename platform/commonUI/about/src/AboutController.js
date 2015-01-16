/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The AboutController provides information to populate the
         * About dialog.
         * @constructor
         * @param {object[]} versions an array of version extensions;
         *        injected from `versions[]`
         * @param $window Angular-injected window object
         */
        function AboutController(versions, $window) {
            return {
                /**
                 * Get version info. This is given as an array of
                 * objects, where each object is intended to appear
                 * as a line-item in the version information listing.
                 * @memberof AboutController#
                 * @returns {object[]} version information
                 */
                versions: function () {
                    return versions;
                },
                /**
                 * Open a new window (or tab, depending on browser
                 * configuration) containing open source licenses.
                 * @memberof AboutController#
                 */
                openLicenses: function () {
                    // Open a new browser window at the licenses route
                    $window.open("#/licenses");
                }
            };
        }

        return AboutController;
    }
);