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
        function MCTRepresentation(representations, views, gestureService, $q, $log) {
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


            function link($scope, element) {
                var gestureHandle;

                function refresh() {
                    var representation = representationMap[$scope.key],
                        domainObject = $scope.domainObject,
                        uses = ((representation || {}).uses || []),
                        gestureKeys = ((representation || {}).gestures || []);

                    $scope.representation = {};
                    $scope.inclusion = pathMap[$scope.key];

                    // Any existing gestures are no longer valid; release them.
                    if (gestureHandle) {
                        gestureHandle.destroy();
                    }

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

                        gestureHandle = gestureService.attachGestures(
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