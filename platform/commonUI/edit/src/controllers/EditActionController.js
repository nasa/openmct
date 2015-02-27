/*global define,Promise*/

/**
 * Module defining EditActionController. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        var ACTION_CONTEXT = { category: 'conclude-editing' };

        /**
         * Controller which supplies action instances for Save/Cancel.
         * @constructor
         */
        function EditActionController($scope) {
            // Maintain all "conclude-editing" actions in the present
            // context.
            function updateActions() {
                $scope.editActions = $scope.action ?
                        $scope.action.getActions(ACTION_CONTEXT) :
                        [];
            }

            // Update set of actions whenever the action capability
            // changes or becomes available.
            $scope.$watch("action", updateActions);
        }

        return EditActionController;
    }
);