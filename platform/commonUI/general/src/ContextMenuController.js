/*global define,Promise*/

/**
 * Module defining ContextMenuController. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ContextMenuController($scope) {
            function updateActions() {
                $scope.menuActions = $scope.action ?
                        $scope.action.getActions({ category: 'contextual' }) :
                        [];
            }

            $scope.$watch("action", updateActions);
        }

        return ContextMenuController;
    }
);