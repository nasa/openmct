/*global define,Promise*/

/**
 * Module defining MCTRepresentation. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function MCTRepresentation(representations, views, gestures, $q, $log) {
            var pathMap = {},
                representationMap = {},
                gestureMap = {};

            // Assemble all representations and views
            // The distinction between views and representations is
            // not important her (view is-a representation)
            representations.concat(views).forEach(function (representation) {
                var path = [
                    representation.bundle.path,
                    representation.bundle.resources,
                    representation.templateUrl
                ].join("/");

                // Consider allowing multiple templates with the same key
                pathMap[representation.key] = path;
                representationMap[representation.key] = representation;
            });

            // Assemble all gestures into a map, similarly
            gestures.forEach(function (gesture) {
                gestureMap[gesture.key] = gesture;
            });

            function findRepresentation(key, domainObject) {
                return representationMap[key];
            }

            function createGestures(element, domainObject, gestureKeys) {
                return gestureKeys.map(function (key) {
                    return gestureMap[key];
                }).filter(function (Gesture) {
                    return Gesture !== undefined && (Gesture.appliesTo ?
                            Gesture.appliesTo(domainObject) :
                            true);
                }).map(function (Gesture) {
                    return new Gesture(element, domainObject);
                });
            }

            function releaseGestures(gestures) {
                gestures.forEach(function (gesture) {
                    if (gesture && gesture.destroy) {
                        gesture.destroy();
                    }
                });
            }

            function link($scope, element) {
                var linkedGestures = [];

                function refresh() {
                    var representation = representationMap[$scope.key],
                        domainObject = $scope.domainObject,
                        uses = ((representation || {}).uses || []),
                        gestureKeys = ((representation || {}).gestures || []);

                    $scope.representation = {};
                    $scope.inclusion = pathMap[$scope.key];

                    // Any existing gestures are no longer valid; release them.
                    releaseGestures(linkedGestures);

                    if (!representation && $scope.key) {
                        $log.warn("No representation found for " + $scope.key);
                    }
                    if (domainObject) {
                        $scope.model = domainObject.getModel();

                        uses.forEach(function (used) {
                            $log.debug([
                                "Requesting capability ",
                                used,
                                " for representation ",
                                $scope.key
                            ].join(""));
                            $q.when(
                                domainObject.useCapability(used)
                            ).then(function (c) {
                                $scope[used] = c;
                            });
                        });

                        linkedGestures = createGestures(
                            element,
                            domainObject,
                            gestureKeys
                        );
                    }
                }

                $scope.$watch("key", refresh);
                $scope.$watch("domainObject", refresh);
                $scope.$watch("domainObject.getModel().modified", refresh);
            }

            return {
                restrict: "E",
                link: link,
                template: '<ng-include src="inclusion"></ng-include>',
                scope: { key: "=", domainObject: "=mctObject", parameters: "=" }
            };
        }

        return MCTRepresentation;
    }
);