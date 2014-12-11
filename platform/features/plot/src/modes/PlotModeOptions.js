/*global define*/

define(
    [],
    function (PlotOverlayMode, PlotStackedMode) {
        "use strict";

        var STACKED = {
                key: "stacked",
                name: "Stacked",
                glyph: "8"
            },
            OVERLAID = {
                key: "overlaid",
                name: "Overlaid",
                glyph: "6"
            };

        function PlotModeOptions(telemetryObjects) {
            var options = telemetryObjects.length > 1 ?
                    [ STACKED, OVERLAID ] : [ OVERLAID, STACKED ];


            return {
                getModeOptions: function () {
                    return options;
                },
                getMode: function (option) {

                }
            };
        }

        return PlotModeOptions;
    }
);