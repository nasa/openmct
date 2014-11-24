/*global define,Promise*/

/**
 * Module defining CreateMenuController. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the Create menu; maintains an up-to-date
         * set of Create actions based on the currently-selected
         * domain object.
         *
         * @constructor
         */
        function CreateMenuController($scope) {
            // Update the set of Create actions
            function refreshActions() {
                $scope.createActions = $scope.action ?
                        $scope.action.getActions('create') :
                        [];
            }

            // Listen for new instances of the represented object's
            // "action" capability. This is provided by the mct-representation
            // for the Create button.
            // A watch is needed here (instead of invoking action.getActions
            // directly) because different action instances may be returned
            // with each call.
            $scope.$watch("action", refreshActions);
        }

        return CreateMenuController;
    }
);