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
        function ViewSwitcherController($scope) {
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
            $scope.$watch("view", function () {
                var options = $scope.view || [ {} ];

                $scope.switcher = {
                    options: options,
                    selected: findMatchingOption(
                        options,
                        ($scope.switcher || {}).selected
                    )
                };
            });
        }

        return ViewSwitcherController;
    }
);