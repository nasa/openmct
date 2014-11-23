/*global define,Promise*/

/**
 * Module defining TreeNodeController. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function TreeNodeController($scope, navigationService) {
            var navigatedObject = navigationService.getNavigation();

            function idsEqual(objA, objB) {
                return objA && objB && (objA.getId() === objB.getId());
            }

            function parentOf(domainObject) {
                var context = domainObject &&
                        domainObject.getCapability("context");
                return context && context.getParent();
            }

            function getId(obj) {
                return obj.getId();
            }

            function isOnNavigationPath(nodeObject, navObject) {
                var nodeContext = nodeObject &&
                            nodeObject.getCapability('context'),
                    navContext = navObject &&
                            navObject.getCapability('context'),
                    nodePath,
                    navPath;

                if (nodeContext && navContext) {
                    nodePath = nodeContext.getPath().map(getId);
                    navPath = navContext.getPath().map(getId);
                    return (navPath.length > nodePath.length) &&
                            nodePath.map(function (id, i) {
                                return id === navPath[i];
                            }).reduce(function (a, b) {
                                return a && b;
                            }, true);

                }
                return false; // No context to judge by
            }

            function checkNavigation() {
                var nodeObject = $scope.domainObject;

                $scope.node.isSelected =
                    idsEqual(nodeObject, navigatedObject) &&
                            idsEqual(parentOf(nodeObject), parentOf(navigatedObject));
                // Expand if necessary
                if (!$scope.node.expanded && isOnNavigationPath(nodeObject, navigatedObject)) {
                    $scope.toggle();
                }
            }

            function setNavigation(object) {
                navigatedObject = object;
                checkNavigation();
            }

            $scope.node = { expanded: false };

            $scope.toggle = function () {
                var expanded = !$scope.node.expanded;
                $scope.node.expanded = expanded;

                // Trigger load of composition, if needed
                $scope.node.domainObject = $scope.domainObject;
            };

            navigationService.addListener(setNavigation);
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });
            $scope.$watch("domainObject", checkNavigation);
        }

        return TreeNodeController;
    }
);