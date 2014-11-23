/*global define,Promise*/

/**
 * Module defining CreateMenuController. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function CreateMenuController($scope) {
            function refreshActions() {
                var actionCapability = $scope.action;
                if (actionCapability) {
                    $scope.createActions =
                        actionCapability.getActions('create');
                }
            }

            $scope.$watch("action", refreshActions);
        }

        return CreateMenuController;
    }
);