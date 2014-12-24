/*global define*/

define(
    ["./SubPlot"],
    function (SubPlot) {
        "use strict";

        /**
         * Utility factory; wraps the SubPlot constructor and adds
         * in a reference to the telemetryFormatter, which will be
         * used to represent telemetry values (timestamps or data
         * values) as human-readable strings.
         * @constructor
         */
        function SubPlotFactory(telemetryFormatter) {
            return {
                /**
                 * Instantiate a new sub-plot.
                 * @param {DomainObject[]} telemetryObjects the domain objects
                 *        which will be plotted in this sub-plot
                 * @param {PlotPanZoomStack} panZoomStack the stack of pan-zoom
                 *        states which is applicable to this sub-plot
                 * @returns {SubPlot} the instantiated sub-plot
                 * @method
                 * @memberof SubPlotFactory
                 */
                createSubPlot: function (telemetryObjects, panZoomStack) {
                    return new SubPlot(
                        telemetryObjects,
                        panZoomStack,
                        telemetryFormatter
                    );
                }
            };
        }

        return SubPlotFactory;

    }
);