/*global define,Promise*/

/**
 * Module defining ContextMenuController. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the context menu. Maintains an up-to-date
         * list of applicable actions (those from category "contextual")
         *
         * @constructor
         */
        function ContextMenuController($scope) {
            // Refresh variable "menuActions" in the scope
            function updateActions() {
                $scope.menuActions = $scope.action ?
                        $scope.action.getActions({ category: 'contextual' }) :
                        [];
            }

            // Update using the action capability
            $scope.$watch("action", updateActions);
        }

        return ContextMenuController;
    }
);