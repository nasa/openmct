/*global define*/

define(
    [],
    function () {
        "use strict";

        function Controller($sce) {
            return {
                trust: function (url) {
                    return $sce.trustAsResourceUrl(url);
                }
            };
        }

        return Controller;
    }

);