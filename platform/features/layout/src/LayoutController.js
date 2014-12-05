/*global define*/

define(
    ['./LayoutDrag'],
    function (LayoutDrag) {
        "use strict";

        var DEFAULT_DIMENSIONS = [ 12, 8 ];

        function LayoutController($scope) {
            var width = 32,
                height = 32,
                activeDrag,
                activeDragId,
                rawPositions = {},
                positions = {};


            function shallowCopy(obj, keys) {
                var copy = {};
                keys.forEach(function (k) {
                    copy[k] = obj[k];
                });
                return copy;
            }

            function convertPosition(raw) {
                return {
                    left: (width * raw.position[0]) + 'px',
                    top: (width * raw.position[1]) + 'px',
                    width: (width * raw.dimensions[0]) + 'px',
                    height: (height * raw.dimensions[1]) + 'px'
                };
            }

            function defaultPosition(index) {
                return {
                    position: [index, index],
                    dimensions: DEFAULT_DIMENSIONS
                };
            }

            function populatePosition(id, index) {
                rawPositions[id] =
                    rawPositions[id] || defaultPosition(index || 0);
                positions[id] =
                    convertPosition(rawPositions[id]);
            }

            function lookupPanels(model) {
                var configuration = $scope.configuration || {},
                    ids = (model || {}).composition || [];

                // Clear prior positions
                rawPositions = shallowCopy(configuration.panels || {}, ids);
                positions = {};

                // Update width/height that we are tracking

                // Pull values from panels field to rawPositions

                // Compute positions and add defaults where needed
                ids.forEach(populatePosition);
            }

            $scope.$watch("model", lookupPanels);

            return {
                getFrameStyle: function (id) {
                    return positions[id];
                },
                startDrag: function (id, posFactor, dimFactor) {
                    activeDragId = id;
                    activeDrag = new LayoutDrag(
                        rawPositions[id],
                        posFactor,
                        dimFactor,
                        [ width, height ]
                    );
                },
                continueDrag: function (delta) {
                    if (activeDrag) {
                        rawPositions[activeDragId] =
                            activeDrag.getAdjustedPosition(delta);
                        populatePosition(activeDragId);
                    }
                },
                endDrag: function () {
                    // Write to configuration; this is watched and
                    // saved by the EditRepresenter.
                    $scope.configuration =
                        $scope.configuration || {};
                    $scope.configuration.panels =
                        $scope.configuration.panels || {};
                    $scope.configuration.panels[activeDragId] =
                        rawPositions[activeDragId];
                }
            };

        }

        return LayoutController;
    }
);