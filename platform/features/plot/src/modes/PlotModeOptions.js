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
                    [ OVERLAID, STACKED ] : [ OVERLAID ],
                mode = options[0];


            return {
                getModeOptions: function () {
                    return options;
                },
                getMode: function () {
                    return mode;
                },
                setMode: function (option) {
                    mode = option;
                }
            };
        }

        return PlotModeOptions;
    }
);