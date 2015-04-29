/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller for embedded web pages; serves simply as a
         * wrapper for `$sce` to mark pages as trusted.
         */
        function EmbeddedPageController($sce) {
            return {
                /**
                 * Alias of `$sce.trustAsResourceUrl`.
                 */
                trust: function (url) {
                    return $sce.trustAsResourceUrl(url);
                }
            };
        }

        return EmbeddedPageController;
    }

);