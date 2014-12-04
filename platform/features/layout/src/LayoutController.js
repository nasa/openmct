/*global define*/

define(
    [],
    function () {
        "use strict";

        var DEFAULT_DIMENSIONS = [ 4, 2 ];

        function LayoutController($scope) {
            var width = 16,
                height = 16,
                positions = {};

            function convertPosition(position, dimensions) {
                return {
                    left: (width * position[0]) + 'px',
                    top: (width * position[1]) + 'px',
                    width: (width * dimensions[0]) + 'px',
                    height: (height * dimensions[1]) + 'px'
                };
            }

            function defaultPosition(index) {
                return convertPosition([index, index], DEFAULT_DIMENSIONS);
            }

            function lookupPanels(model) {
                var configuration =
                    ((model || {}).configuration || {}).layout || {};

                // Clear prior positions
                positions = {};

                // Update width/height that we are tracking

                // Pull values from panels field

                // Add defaults where needed
                ((model || {}).composition || []).forEach(function (id, i) {
                    positions[id] = positions[id] || defaultPosition(i);
                });
            }



            $scope.$watch("model", lookupPanels);

            return {
                getFrameStyle: function (id) {
                    return positions[id];
                }
            };

        }

        return LayoutController;
    }
);