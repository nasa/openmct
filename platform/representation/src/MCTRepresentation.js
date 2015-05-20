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
        function MCTRepresentation(representations, views, representers, $q, $log) {
            var representationMap = {},
                gestureMap = {};

            // Assemble all representations and views
            // The distinction between views and representations is
            // not important here (view is-a representation)
            representations.concat(views).forEach(function (representation) {
                var key = representation.key;

                // Store the representation
                representationMap[key] = representationMap[key] || [];
                representationMap[representation.key].push(representation);
            });

            // Get a path to a representation
            function getPath(representation) {
                return [
                    representation.bundle.path,
                    representation.bundle.resources,
                    representation.templateUrl
                ].join("/");
            }

            // Look up a matching representation for this domain object
            function lookup(key, domainObject) {
                var candidates = representationMap[key] || [],
                    type,
                    i;
                // Filter candidates by object type
                for (i = 0; i < candidates.length; i += 1) {
                    type = candidates[i].type;
                    if (!type || !domainObject ||
                            domainObject.getCapability('type').instanceOf(type)) {
                        return candidates[i];
                    }
                }
            }

            function link($scope, element, attrs) {
                var activeRepresenters = representers.map(function (Representer) {
                        return new Representer($scope, element, attrs);
                    }),
                    toClear = [], // Properties to clear out of scope on change
                    counter = 0;

                // Populate scope with any capabilities indicated by the
                // representation's extension definition
                function refreshCapabilities() {
                    var domainObject = $scope.domainObject,
                        representation = lookup($scope.key, domainObject),
                        uses = ((representation || {}).uses || []),
                        myCounter = counter;

                    if (domainObject) {
                        // Update model
                        $scope.model = domainObject.getModel();

                        // Provide any of the capabilities requested
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
                                // Avoid clobbering capabilities from
                                // subsequent representations;
                                // Angular reuses scopes.
                                if (counter === myCounter) {
                                    $scope[used] = c;
                                }
                            });
                        });
                    }
                }

                // General-purpose refresh mechanism; should set up the scope
                // as appropriate for current representation key and
                // domain object.
                function refresh() {
                    var domainObject = $scope.domainObject,
                        representation = lookup($scope.key, domainObject),
                        uses = ((representation || {}).uses || []);

                    // Create an empty object named "representation", for this
                    // representation to store local variables into.
                    $scope.representation = {};

                    // Look up the actual template path, pass it to ng-include
                    // via the "inclusion" field
                    $scope.inclusion = representation && getPath(representation);

                    // Any existing gestures are no longer valid; release them.
                    activeRepresenters.forEach(function (activeRepresenter) {
                        activeRepresenter.destroy();
                    });

                    // Log if a key was given, but no matching representation
                    // was found.
                    if (!representation && $scope.key) {
                        $log.warn("No representation found for " + $scope.key);
                    }

                    // Clear out the scope from the last representation
                    toClear.forEach(function (property) {
                        delete $scope[property];
                    });

                    // Populate scope with fields associated with the current
                    // domain object (if one has been passed in)
                    if (domainObject) {
                        // Track how many representations we've made in this scope,
                        // to ensure that the correct representations are matched to
                        // the correct object/key pairs.
                        counter += 1;

                        // Initialize any capabilities
                        refreshCapabilities();

                        // Also provide the view configuration,
                        // for the specific view
                        $scope.configuration =
                            ($scope.model.configuration || {})[$scope.key] || {};

                        // Finally, wire up any additional behavior (such as
                        // gestures) associated with this representation.
                        activeRepresenters.forEach(function (representer) {
                            representer.represent(representation, domainObject);
                        });

                        // Track which properties we want to clear from scope
                        // next change object/key pair changes
                        toClear = uses.concat(['model']);
                    }
                }

                // Update the representation when the key changes (e.g. if a
                // different representation has been selected)
                $scope.$watch("key", refresh);

                // Also update when the represented domain object changes
                // (to a different object)
                $scope.$watch("domainObject", refresh);

                // Finally, also update when there is a new version of that
                // same domain object; these changes should be tracked in the
                // model's "modified" field, by the mutation capability.
                $scope.$watch("domainObject.getModel().modified", refreshCapabilities);

                // Do one initial refresh, so that we don't need another
                // digest iteration just to populate the scope. Failure to
                // do this can result in unstable digest cycles, which
                // Angular will detect, and throw an Error about.
                refresh();
            }

            return {
                // Only applicable at the element level
                restrict: "E",

                // Handle Angular's linking step
                link: link,

                // Use ng-include as a template; "inclusion" will be the real
                // template path
                template: '<ng-include src="inclusion"></ng-include>',

                // Two-way bind key and parameters, get the represented domain
                // object as "mct-object"
                scope: {
                    key: "=",
                    domainObject: "=mctObject",
                    ngModel: "=",
                    parameters: "="
                }
            };
        }

        return MCTRepresentation;
    }
);