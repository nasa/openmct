/*global define*/

define([
    './MCTTicksController'
], function (
    MCTTicksController
) {

    function MCTTicksDirective() {
        return {
            priority: 1000,
            restrict: "E",
            scope: true,
            controllerAs: 'ticksController',
            controller: MCTTicksController,
            bindToController: {
                axis: '='
            }
        };
    }

    return MCTTicksDirective;
});
