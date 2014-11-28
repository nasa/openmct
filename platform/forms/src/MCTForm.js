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

                $scope.$watch("mctForm", function (mctForm) {
                    if ($scope.name) {
                        $scope.$parent[$scope.name] = mctForm;
                    }
                });

                $scope.getRegExp = getRegExp;
            }

            return {
                restrict: "E",
                templateUrl: templatePath,
                controller: controller,
                scope: {
                    structure: "=",
                    ngModel: "=",
                    name: "@"
                }
            };
        }

        return MCTForm;
    }
);