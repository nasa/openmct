/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(function () {
    'use strict';
    return function CLIController($scope, navigationService, objectService) {
        var unlistenToMutation,
            currentComposition = [];

        function print(str, cssClass) {
            $scope.stdout.push({
                text: str,
                cssClass: cssClass
            });
            $scope.stdoutScroll = Number.MAX_VALUE;
        }

        function pad(str, length) {
            while (str.length < length) {
                str += " ";
            }
            return str;
        }

        function summarize(domainObject) {
            var type = domainObject.getCapability("type"),
                typeName = type ? type.getName() : "Object",
                location = domainObject.getCapability('location'),
                isLink = (location && location.isLink()),
                suffix = isLink ? " (link)" : "";
            return "[" + typeName + "] " + domainObject.getModel().name + suffix;
        }

        function printComposition(domainObject) {
            return domainObject.useCapability("composition").then(function (c) {
                currentComposition = c;
                c.forEach(function (childObject, i) {
                    print(i + ") " + summarize(childObject));
                });
            });
        }

        function printObject(domainObject, callback) {
            // Exclude the root object; nobody wants to see that
            if (domainObject.hasCapability("context")) {
                print(summarize(domainObject));
            }
            if (domainObject.hasCapability('composition')) {
                printComposition(domainObject).then(callback);
            } else {
                callback();
            }
        }

        function unlisten() {
            if (unlistenToMutation) {
                unlistenToMutation();
                unlistenToMutation = undefined;
            }
        }

        function navChange(domainObject) {
            unlisten();
            unlistenToMutation = domainObject.getCapability("mutation")
                .listen(function () { printObject(domainObject); });
            printObject(domainObject);
        }

        function findTarget(id) {
            if (id === "this") {
                return navigationService.getNavigation();
            } else {
                return currentComposition[parseInt(id, 10)];
            }
        }

        function listActions(domainObject, index) {
            // Don't show actions for the root
            if (!domainObject.hasCapability('context')) {
                return;
            }

            domainObject.getCapability('action').getActions().forEach(function (a) {
                var metadata = a.getMetadata(),
                    desc = metadata.description,
                    suffix = index !== undefined ? (" " + index) : "";
                print(pad(metadata.key + suffix, 32) + (desc || ""));
            });
        }

        function performAction(domainObject, action) {
            domainObject.getCapability('action').perform(action);
        }

        function handleInput(input) {
            var parts = input.split(" "),
                targetObject;

            if (input.length === 0) {
                targetObject = navigationService.getNavigation();
                if (targetObject) {
                    printObject(targetObject, function () {
                        print("");
                        listActions(targetObject);
                    });
                }
                return;
            } else if (parts.length === 1) {
                if (isNaN(parseInt(parts[0], 10))) {
                    targetObject = navigationService.getNavigation();
                    performAction(targetObject, parts[0]);
                    return;
                }
                targetObject = findTarget(parts[0]);
                if (targetObject) {
                    listActions(targetObject, parts[0]);
                    return;
                }
            } else if (parts.length === 2) {
                targetObject = findTarget(parts[1]);
                if (targetObject) {
                    performAction(targetObject, parts[0]);
                    return;
                }
            }

            // Any parse-able input should have returned already.
            print("SYNTAX ERROR. READY.");
        }

        if (!navigationService.getNavigation()) {
            objectService.getObjects(["ROOT"]).then(function (objects) {
                navigationService.setNavigation(objects.ROOT);
            });
        }

        navigationService.addListener(navChange);

        $scope.stdout = [];
        $scope.stdin = "";
        $scope.stdoutScroll = 0;

        $scope.enter = function (input) {
            $scope.stdin = "";
            print("");
            print(input, "iw-user-input");
            print("");

            handleInput(input);
        };

        $scope.$on("$destroy", function () {
            navigationService.removeListener(navChange);
            unlisten();
        });
    };
});
