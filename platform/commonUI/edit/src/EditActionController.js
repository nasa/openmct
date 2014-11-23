/*global define,Promise*/

/**
 * Module defining EditActionController. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Controller which supplies action instances for Save/Cancel.
         * @constructor
         */
        function EditActionController($scope) {
            function updateActions() {
                if (!$scope.action) {
                    $scope.editActions = [];
                } else {
                    $scope.editActions = $scope.action.getActions({
                        category: 'conclude-editing'
                    });
                }
            }

            $scope.$watch("action", updateActions);
        }

        return EditActionController;
    }
);