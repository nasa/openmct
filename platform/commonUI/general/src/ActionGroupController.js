/*global define,Promise*/

/**
 * Module defining ActionGroupController. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Controller which keeps an up-to-date list of actions of
         * a certain category, and additionally bins them into
         * groups as described by their metadata. Used specifically
         * to support button groups.
         *
         * This will maintain two fields in the scope:
         * * `groups`: An array of arrays. Each element in the outer
         *   array corresponds to a group; the inner array contains
         *   the actions which are in that group.
         * * `ungrouped`: All actions which did not have a defined
         *   group.
         *
         * @constructor
         */
        function ActionGroupController($scope) {

            // Separate out the actions that have been retrieved
            // into groups, and populate scope with this.
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

            // Callback for when state which might influence action groupings
            // changes.
            function updateGroups() {
                var actionCapability = $scope.action,
                    params = $scope.parameters || {},
                    category = params.category;

                if (actionCapability && category) {
                    // Get actions by capability, and group them
                    groupActions(actionCapability.getActions({
                        category: category
                    }));
                } else {
                    // We don't have enough information to get any actions.
                    groupActions([]);
                }
            }

            // Changes to the represented object, to its action capability, or
            // to the chosen action category may all require an update.
            $scope.$watch("domainObject", updateGroups);
            $scope.$watch("action", updateGroups);
            $scope.$watch("parameters.category", updateGroups);

            // Start with empty arrays.
            $scope.ungrouped = [];
            $scope.groups = [];
        }

        return ActionGroupController;
    }
);