/*global define*/

define(
    [],
    function () {
        "use strict";

        function CouchIndicator($http, $interval, PATH, INTERVAL) {
            function updateIndicator() {

            }

            $interval(updateIndicator, INTERVAL);

            return {
                getGlyph: function () {
                    return "D";
                }
            }

        }

        return CouchIndicator;
    }
);