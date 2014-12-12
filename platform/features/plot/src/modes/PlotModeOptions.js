/*global define*/

define(
    ["./PlotOverlayMode", "./PlotStackMode"],
    function (PlotOverlayMode, PlotStackMode) {
        "use strict";

        var STACKED = {
                key: "stacked",
                name: "Stacked",
                glyph: "8",
                factory: PlotStackMode
            },
            OVERLAID = {
                key: "overlaid",
                name: "Overlaid",
                glyph: "6",
                factory: PlotOverlayMode
            };

        /**
         * Determines which plotting modes (stacked/overlaid)
         * are applicable in a given plot view, maintains current
         * selection state thereof, and provides handlers for the
         * different behaviors associated with these modes.
         * @constructor
         * @param {DomainObject[]} the telemetry objects being
         *        represented in this plot view
         */
        function PlotModeOptions(telemetryObjects) {
            var options = telemetryObjects.length > 1 ?
                    [ OVERLAID, STACKED ] : [ OVERLAID ],
                mode = options[0], // Initial selection (overlaid)
                modeHandler;

            return {
                /**
                 * Get a handler for the current mode. This will handle
                 * plotting telemetry, providing subplots for the template,
                 * and view-level interactions with pan-zoom state.
                 * @returns {PlotOverlayMode|PlotStackMode} a handler
                 *          for the current mode
                 */
                getModeHandler: function () {
                    // Lazily initialize
                    if (!modeHandler) {
                        modeHandler = mode.factory(telemetryObjects);
                    }
                    return modeHandler;
                },
                /**
                 * Get all mode options available for each plot. Each
                 * mode contains a `name` and `glyph` field suitable
                 * for display in a template.
                 * @return {Array} the available modes
                 */
                getModeOptions: function () {
                    return options;
                },
                /**
                 * Get the plotting mode option currently in use.
                 * This will be one of the elements returned from
                 * `getModeOptions`.
                 * @return {object} the current mode
                 */
                getMode: function () {
                    return mode;
                },
                /**
                 * Set the plotting mode option to use.
                 * The passed argument must be one of the options
                 * returned by `getModeOptions`.
                 * @param {object} option one of the plot mode options
                 *        from `getModeOptions`
                 */
                setMode: function (option) {
                    if (mode !== option) {
                        mode = option;
                        // Clear the existing mode handler, so it
                        // can be instantiated next time it's needed.
                        modeHandler = undefined;
                    }
                }
            };
        }

        return PlotModeOptions;
    }
);