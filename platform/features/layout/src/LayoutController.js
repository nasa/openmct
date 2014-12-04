/*global define*/

define(
    [],
    function () {
        "use strict";

        var DEFAULT_DIMENSIONS = [ 4, 2 ];

        function LayoutController($scope) {
            var width = 16,
                height = 16,
                rawPositions = {},
                positions = {};

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
                rawPositions[id] = rawPositions[id] || defaultPosition(index);
                positions[id] = convertPosition(rawPositions[id]);
            }

            function lookupPanels(model) {
                var configuration =
                    ((model || {}).configuration || {}).layout || {};

                // Clear prior positions
                positions = {};

                // Update width/height that we are tracking

                // Pull values from panels field to rawPositions

                // Compute positions and add defaults where needed
                ((model || {}).composition || []).forEach(populatePosition);
            }

            $scope.$watch("model", lookupPanels);

            return {
                getFrameStyle: function (id) {
                    return positions[id];
                },
                startDrag: function (event) {
                    console.log("start", event);
                },
                continueDrag: function (event) {
                    console.log("continue", event);
                },
                endDrag: function (event) {
                    console.log("end", event);
                }
            };

        }

        return LayoutController;
    }
);