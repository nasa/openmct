/*global define,window*/

define([
    './MCTPlotController',
    'text!../../res/templates/mct-plot.html'
], function (
    MCTPlotController,
    PlotTemplate
) {
    'use strict';

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
