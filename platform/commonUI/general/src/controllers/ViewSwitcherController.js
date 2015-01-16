/*global define,Promise*/

/**
 * Module defining ViewSwitcherController. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the view switcher; populates and maintains a list
         * of applicable views for a represented domain object.
         * @constructor
         */
        function ViewSwitcherController($scope, $timeout) {
            // If the view capability gets refreshed, try to
            // keep the same option chosen.
            function findMatchingOption(options, selected) {
                var i;

                if (selected) {
                    for (i = 0; i < options.length; i += 1) {
                        if (options[i].key === selected.key) {
                            return options[i];
                        }
                    }
                }

                return options[0];
            }

            // Get list of views, read from capability
            function updateOptions(views) {
                $timeout(function () {
                    $scope.ngModel.selected = findMatchingOption(
                        views || [],
                        ($scope.ngModel || {}).selected
                    );
                }, 0);
            }

            // Update view options when the in-scope results of using the
            // view capability change.
            $scope.$watch("view", updateOptions);
        }

        return ViewSwitcherController;
    }
);