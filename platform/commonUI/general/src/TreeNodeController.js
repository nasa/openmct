/*global define,Promise*/

/**
 * Module defining TreeNodeController. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The TreeNodeController supports the tree node representation;
         * a tree node has a label for the current object as well as a
         * subtree which shows (and is not loaded until) the node is
         * expanded.
         *
         * This controller tracks the following, so that the tree node
         * template may update its state accordingly:
         *
         * * Whether or not the tree node has ever been expanded (this
         *   is used to lazily load, exactly once, the subtree)
         * * Whether or not the node is currently the domain object
         *   of navigation (this gets highlighted differently to
         *   provide the user with visual feedback.)
         *
         * Additionally, this controller will automatically trigger
         * node expansion when this tree node's _subtree_ will contain
         * the navigated object (recursively, this becomes an
         * expand-to-show-navigated-object behavior.)
         * @constructor
         */
        function TreeNodeController($scope, navigationService) {
            var navigatedObject = navigationService.getNavigation(),
                isNavigated = false,
                hasBeenExpanded = false;

            // Look up the id for a domain object. A convenience
            // for mapping; additionally does some undefined-checking.
            function getId(obj) {
                return obj && obj.getId && obj.getId();
            }

            // Check if two domain objects have the same ID
            function idsEqual(objA, objB) {
                return getId(objA) === getId(objB);
            }

            // Get the parent of a domain object, as reported by
            // its context capability. This is used to distinguish
            // two different instances of a domain object that have
            // been reached in different ways.
            function parentOf(domainObject) {
                var context = domainObject &&
                        domainObject.getCapability("context");
                return context && context.getParent();
            }

            // Verify that id paths are equivalent, staring at
            // index, ending at the end of the node path.
            function checkPath(nodePath, navPath, index) {
                index = index || 0;

                // The paths overlap if we have made it past the
                // end of the node's path; otherwise, check the
                // id at the current index for equality and perform
                // a recursive step for subsequent ids in the paths,
                // until we exceed path length or hit a mismatch.
                return (index >= nodePath.length) ||
                        (idsEqual(navPath[index], nodePath[index]) &&
                                checkPath(nodePath, navPath, index + 1));
            }

            // Check if the navigated object is in the subtree of this
            // node's domain object, by comparing the paths reported
            // by their context capability.
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

            // Consider the currently-navigated object and update
            // parameters which support display.
            function checkNavigation() {
                var nodeObject = $scope.domainObject;

                // Check if we are the navigated object. Check the parent
                // as well to make sure we are the same instance of the
                // navigated object.
                isNavigated =
                    idsEqual(nodeObject, navigatedObject) &&
                            idsEqual(parentOf(nodeObject), parentOf(navigatedObject));

                // Expand if necessary (if the navigated object will
                // be in this node's subtree)
                if (isOnNavigationPath(nodeObject, navigatedObject) &&
                        $scope.toggle !== undefined) {
                    $scope.toggle.setState(true);
                    hasBeenExpanded = true;
                }
            }

            // Callback for the navigation service; track the currently
            // navigated object and update display parameters as needed.
            function setNavigation(object) {
                navigatedObject = object;
                checkNavigation();
            }

            // Listen for changes which will effect display parameters
            navigationService.addListener(setNavigation);
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });
            $scope.$watch("domainObject", checkNavigation);

            return {
                /**
                 * This method should be called when a node is expanded
                 * to record that this has occurred, to support one-time
                 * lazy loading of the node's subtree.
                 */
                trackExpansion: function () {
                    hasBeenExpanded = true;
                },
                /**
                 * Check if this not has ever been expanded.
                 * @returns true if it has been expanded
                 */
                hasBeenExpanded: function () {
                    return hasBeenExpanded;
                },
                /**
                 * Check whether or not the domain object represented by
                 * this tree node is currently the navigated object.
                 * @returns true if this is the navigated object
                 */
                isNavigated: function () {
                    return isNavigated;
                }
            };
        }

        return TreeNodeController;
    }
);