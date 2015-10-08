/*global define*/

define(function () {
    'use strict';
    return function CLIController($scope, navigationService, objectService) {
        var unlistenToMutation,
            currentComposition = [];

        function print(str) {
            $scope.stdout.push(str);
        }


        function summarize(domainObject) {
            var type = domainObject.getCapability("type"),
                typeName = type ? type.getName() : "Object";
            return "[" + typeName + "] " + domainObject.getModel().name;
        }

        function printComposition(domainObject) {
            domainObject.useCapability("composition").then(function (c) {
                currentComposition = c;
                c.forEach(function (childObject, i) {
                    print(i + ") " + summarize(childObject));
                });
            });
        }

        function printObject(domainObject) {
            // Exclude the root object; nobody wants to see that
            if (domainObject.hasCapability("context")) {
                print("this = " + summarize(domainObject));
            }
            if (domainObject.hasCapability('composition')) {
                printComposition(domainObject);
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

        function listActions(domainObject) {
            domainObject.getCapability('action').getActions().forEach(function (a) {
                var metadata = a.getMetadata();
                print(metadata.key + " " + metadata.description);
            });
        }

        function performAction(domainObject, action) {
            domainObject.getCapability('action').perform(action);
        }

        function handleInput(input) {
            var parts = input.split(" "),
                targetObject;

            if (parts.length === 1) {
                targetObject = findTarget(parts[0]);
                if (targetObject) {
                    listActions(targetObject);
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

        $scope.enter = function (input) {
            $scope.stdin = "";
            print("");
            print(input);
            print("");

            handleInput(input);
        };

        $scope.$on("$destroy", function () {
            navigationService.removeListener(navChange);
            unlisten();
        });
    };
});
