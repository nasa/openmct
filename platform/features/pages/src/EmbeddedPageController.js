/*global define*/

define(
    [],
    function () {
        "use strict";

        function EmbeddedPageController($sce) {
            return {
                trust: function (url) {
                    return $sce.trustAsResourceUrl(url);
                }
            };
        }

        return EmbeddedPageController;
    }

);