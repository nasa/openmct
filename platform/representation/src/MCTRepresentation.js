/*global define,Promise*/

/**
 * Module defining MCTRepresentation. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";


        /**
         * Defines the mct-representation directive. This may be used to
         * present domain objects as HTML (with event wiring), with the
         * specific representation being mapped to a defined extension
         * (as defined in either the `representation` category-of-extension,
         * or the `views` category-of-extension.)
         *
         * This directive uses two-way binding for three attributes:
         *
         * * `key`, matched against the key of a defined template extension
         *   in order to determine which actual template to include.
         * * `mct-object`, populated as `domainObject` in the loaded
         *   template's scope. This is the domain object being
         *   represented as HTML by this directive.
         * * `parameters`, used to communicate display parameters to
         *   the included template (e.g. title.)
         *
         * @constructor
         * @param {RepresentationDefinition[]} representations an array of
         *        representation extensions
         * @param {ViewDefinition[]} views an array of view extensions
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