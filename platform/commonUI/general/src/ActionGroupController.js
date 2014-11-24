/*global define,Promise*/

/**
 * Module defining ActionGroupController. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ActionGroupController($scope) {
            function groupActions(actions) {
                var groups = {},
                    ungrouped = [];

                function assignToGroup(action) {
                    var metadata = action.getMetadata(),
                        group = metadata.group;
                    if (group) {
                        groups[group] = groups[group] || [];
                        groups[group].push(action);
                    } else {
                        ungrouped.push(action);
                    }
                }

                (actions || []).forEach(assignToGroup);

                $scope.ungrouped = ungrouped;
                $scope.groups = Object.keys(groups).sort().map(function (k) {
                    return groups[k];
                });
            }

            function updateGroups() {
                var actionCapability = $scope.action,
                    params = $scope.parameters || {},
                    category = params.category;

                if (actionCapability && category) {
                    groupActions(actionCapability.getActions({ category: category }));
                }
            }

            $scope.$watch("domainObject", updateGroups);
            $scope.$watch("action", updateGroups);
            $scope.$watch("parameters.category", updateGroups);

            $scope.ungrouped = [];
            $scope.groups = [];
        }

        return ActionGroupController;
    }
);