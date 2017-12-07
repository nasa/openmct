/*global define*/

define([
    'text!../../res/templates/plot.html'
], function (
    PlotTemplate
) {
    return function MCTOverlayPlot() {
        return {
            restrict: "E",
            template: PlotTemplate,
            scope: {
                domainObject: "="
            }
        };
    };
});
