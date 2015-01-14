/*global define*/

define(
    [],
    function () {
        "use strict";

        function AboutController(versions, $window) {
            return {
                versions: function () {
                    return versions;
                },
                openLicenses: function () {
                    $window.open("#/licenses");
                }
            };
        }

        return AboutController;
    }
);