/*global define*/

define(
    [],
    function () {
        "use strict";

        // Default ng-pattern; any non whitespace
        var NON_WHITESPACE = /\S/;

        /**
         * Controller for mct-form and mct-toolbar directives.
         * @constructor
         */
        function FormController($scope) {
            var regexps = [];

            // ng-pattern seems to want a RegExp, and not a
            // string (despite what documentation says) but
            // we want form structure to be JSON-expressible,
            // so we make RegExp's from strings as-needed
            function getRegExp(pattern) {
                // If undefined, don't apply a pattern
                if (!pattern) {
                    return NON_WHITESPACE;
                }

                // Just echo if it's already a regexp
                if (pattern instanceof RegExp) {
                    return pattern;
                }

                // Otherwise, assume a string
                // Cache for easy lookup later (so we don't
                // creat a new RegExp every digest cycle)
                if (!regexps[pattern]) {
                    regexps[pattern] = new RegExp(pattern);
                }

                return regexps[pattern];
            }

            // Publish the form state under the requested
            // name in the parent scope
            $scope.$watch("mctForm", function (mctForm) {
                if ($scope.name) {
                    $scope.$parent[$scope.name] = mctForm;
                }
            });

            // Expose the regexp lookup
            $scope.getRegExp = getRegExp;
        }

        return FormController;
    }
);