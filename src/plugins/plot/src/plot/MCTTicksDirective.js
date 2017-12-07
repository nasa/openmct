/*global define,window*/

define([
    './MCTTicksController'
], function (
    MCTTicksController
) {
    'use strict';

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
