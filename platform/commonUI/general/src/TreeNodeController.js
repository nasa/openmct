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
            var navigatedObject = navigationService.getNavigation(),
                isNavigated = false,
                expandedObject;

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

            // Verify that id paths are equivalent, staring at
            // index, ending at the end of the node path.
            function checkPath(nodePath, navPath, index) {
                index = index || 0;
                return index > nodePath.length ||
                        (navPath[index] === nodePath[index] &&
                                checkPath(nodePath, navPath, index + 1));
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
                            checkPath(nodePath, navPath);
                }
                return false; // No context to judge by
            }

            function checkNavigation() {
                var nodeObject = $scope.domainObject;

                isNavigated =
                    idsEqual(nodeObject, navigatedObject) &&
                            idsEqual(parentOf(nodeObject), parentOf(navigatedObject));

                // Expand if necessary
                if (isOnNavigationPath(nodeObject, navigatedObject) &&
                        $scope.toggle !== undefined &&
                        $scope.toggle.isActive()) {
                    $scope.toggle.toggle();
                    expandedObject = nodeObject;
                }
            }

            function setNavigation(object) {
                navigatedObject = object;
                checkNavigation();
            }

            navigationService.addListener(setNavigation);
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });
            $scope.$watch("domainObject", checkNavigation);

            return {
                setNodeObject: function (domainObject) {
                    expandedObject = domainObject;
                },
                getNodeObject: function () {
                    return expandedObject;
                },
                isNavigated: function () {
                    return isNavigated;
                }
            };
        }

        return TreeNodeController;
    }
);