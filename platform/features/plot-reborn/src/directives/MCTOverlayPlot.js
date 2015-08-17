/*global define*/

define(function () {
        return function MCTOverlayPlot() {
            return {
                restrict: "E",
                templateUrl: 'platform/features/plot-reborn/res/templates/plot.html',
                scope: {
                    domainObject: "="
                }
            };
        };
    }
);
