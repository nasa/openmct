/*global define,Promise*/

/**
 * Module defining MCTForm. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        var MATCH_ALL = /^.*$/;

        /**
         * The mct-form directive allows generation of displayable
         * forms based on a declarative description of the form's
         * structure.
         *
         * This directive accepts three attributes:
         *
         * * `ng-model`: The model for the form; where user input
         *   where be stored.
         * * `structure`: The declarative structure of the form.
         *   Describes what controls should be shown and where
         *   their values should be read/written in the model.
         * * `name`: The name under which to expose the form's
         *   dirty/valid state. This is similar to ng-form's use
         *   of name, except this will be made available in the
         *   parent scope.
         *
         * @constructor
         */
        function MCTForm() {
            var templatePath = [
                "platform/forms", //MCTForm.bundle.path,
                "res", //MCTForm.bundle.resources,
                "templates/form.html"
            ].join("/");

            function controller($scope) {
                var regexps = [],
                    matchAll = /.*/;

                // ng-pattern seems to want a RegExp, and not a
                // string (despite what documentation says) but
                // we want form structure to be JSON-expressible,
                // so we make RegExp's from strings as-needed
                function getRegExp(pattern) {
                    // If undefined, don't apply a pattern
                    if (!pattern) {
                        return MATCH_ALL;
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

                $scope.getRegExp = getRegExp;
            }

            return {
                // Only show at the element level
                restrict: "E",

                // Load the forms template
                templateUrl: templatePath,

                // Use the controller defined above to
                // populate/respond to changes in scope
                controller: controller,

                // Initial an isolate scope
                scope: {

                    // The model: Where form input will actually go
                    ngModel: "=",

                    // Form structure; what sections/rows to show
                    structure: "=",

                    // Name under which to publish the form
                    name: "@"
                }
            };
        }

        return MCTForm;
    }
);