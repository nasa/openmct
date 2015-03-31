/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Defines the `mct-before-unload` directive. The expression bound
         * to this attribute will be evaluated during page navigation events
         * and, if it returns a truthy value, will be used to populate a
         * prompt to the user to confirm this navigation.
         * @constructor
         * @param $window the window
         */
        function MCTBeforeUnload($window) {
            var unloads = [],
                oldBeforeUnload = $window.onbeforeunload;

            // Run all unload functions, returning the first returns truthily.
            function checkUnloads() {
                var result;
                unloads.forEach(function (unload) {
                    result = result || unload();
                });
                return result;
            }

            // Link function for an mct-before-unload directive usage
            function link(scope, element, attrs) {
                // Invoke the
                function unload() {
                    return scope.$eval(attrs.mctBeforeUnload);
                }

                // Stop using this unload expression
                function removeUnload() {
                    unloads = unloads.filter(function (callback) {
                        return callback !== unload;
                    });
                    if (unloads.length === 0) {
                        $window.onbeforeunload = oldBeforeUnload;
                    }
                }

                // If this is the first active instance of this directive,
                // register as the window's beforeunload handler
                if (unloads.length === 0) {
                    $window.onbeforeunload = checkUnloads;
                }

                // Include this instance of the directive's unload function
                unloads.push(unload);

                // Remove it when the scope is destroyed
                scope.$on("$destroy", removeUnload);
            }

            return {
                // Applicable as an attribute
                restrict: "A",
                // Link with the provided function
                link: link
            };
        }

        return MCTBeforeUnload;

    }
);