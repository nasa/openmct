/*global define*/

define(function () {
    'use strict';
    return function CLIController($scope, navigationService, objectService) {
        var unlistenToMutation;

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
                c.forEach(function (childObject, i) {
                    print(i + ") " + summarize(childObject));
                });
            });
        }

        function printObject(domainObject) {
            print("this = " + summarize(domainObject));
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
        };

        $scope.$on("$destroy", function () {
            navigationService.removeListener(navChange);
            unlisten();
        });
    };
});
