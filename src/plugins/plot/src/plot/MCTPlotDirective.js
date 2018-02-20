/*global define*/

define([
    './MCTPlotController',
    'text!../../res/templates/mct-plot.html'
], function (
    MCTPlotController,
    PlotTemplate
) {

    function MCTPlot() {

        return {
            restrict: "E",
            template: PlotTemplate,
            controller: MCTPlotController,
            controllerAs: 'mctPlotController',
            bindToController: {
                config: "="
            },
            scope: true
        };
    }

    return MCTPlot;
});
