/*global define*/

define(
    [],
    function () {
        "use strict";

        var CONNECTED = {
                text: "Connected",
                glyphClass: "ok"
            },
            DISCONNECTED = {
                text: "Disconnected",
                glyphClass: "err"
            },
            PENDING = {
                text: "Checking connection..."
            };

        function CouchIndicator($http, $interval, PATH, INTERVAL) {
            var state = PENDING;

            function handleError(err) {
                state = DISCONNECTED;
            }

            function handleResponse(response) {
                var data = response.data;

                state = data.error ? DISCONNECTED : CONNECTED;
            }

            function updateIndicator() {
                $http.get(PATH).then(handleResponse, handleError);
            }

            updateIndicator();
            $interval(updateIndicator, INTERVAL);

            return {
                getGlyph: function () {
                    return "D";
                },
                getGlyphClass: function () {
                    return state.glyphClass;
                },
                getText: function () {
                    return state.text;
                }
            };

        }

        return CouchIndicator;
    }
);