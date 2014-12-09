/*global define*/

define(
    ['./LayoutDrag'],
    function (LayoutDrag) {
        "use strict";

        var DEFAULT_DIMENSIONS = [ 12, 8 ],
            DEFAULT_GRID_SIZE = [32, 32];

        /**
         * The LayoutController is responsible for supporting the
         * Layout view. It arranges frames according to saved configuration
         * and provides methods for updating these based on mouse
         * movement.
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function LayoutController($scope) {
            var gridSize = DEFAULT_GRID_SIZE,
                activeDrag,
                activeDragId,
                rawPositions = {},
                positions = {};

            // Utility function to copy raw positions from configuration,
            // without writing directly to configuration (to avoid triggering
            // persistence from watchers during drags).
            function shallowCopy(obj, keys) {
                var copy = {};
                keys.forEach(function (k) {
                    copy[k] = obj[k];
                });
                return copy;
            }

            // Convert from { positions: ..., dimensions: ... } to an
            // apropriate ng-style argument, to position frames.
            function convertPosition(raw) {
                // Multiply position/dimensions by grid size
                return {
                    left: (gridSize[0] * raw.position[0]) + 'px',
                    top: (gridSize[1] * raw.position[1]) + 'px',
                    width: (gridSize[0] * raw.dimensions[0]) + 'px',
                    height: (gridSize[1] * raw.dimensions[1]) + 'px'
                };
            }

            // Generate a default position (in its raw format) for a frame.
            // Use an index to ensure that default positions are unique.
            function defaultPosition(index) {
                return {
                    position: [index, index],
                    dimensions: DEFAULT_DIMENSIONS
                };
            }

            // Store a computed position for a contained frame by its
            // domain object id. Called in a forEach loop, so arguments
            // are as expected there.
            function populatePosition(id, index) {
                rawPositions[id] =
                    rawPositions[id] || defaultPosition(index || 0);
                positions[id] =
                    convertPosition(rawPositions[id]);
            }

            // Compute panel positions based on the layout's object model
            function lookupPanels(model) {
                var configuration = $scope.configuration || {},
                    ids = (model || {}).composition || [];

                // Pull panel positions from configuration
                rawPositions = shallowCopy(configuration.panels || {}, ids);

                // Clear prior computed positions
                positions = {};

                // Update width/height that we are tracking
                gridSize = (model || {}).layoutGrid || DEFAULT_GRID_SIZE;

                // Compute positions and add defaults where needed
                ids.forEach(populatePosition);
            }

            // Position panes when the model field changes
            $scope.$watch("model", lookupPanels);

            return {
                /**
                 * Get a style object for a frame with the specified domain
                 * object identifier, suitable for use in an `ng-style`
                 * directive to position a frame as configured for this layout.
                 * @param {string} id the object identifier
                 * @returns {Object.<string, string>} an object with
                 *          appropriate left, width, etc fields for positioning
                 */
                getFrameStyle: function (id) {
                    // Called in a loop, so just look up; the "positions"
                    // object is kept up to date by a watch.
                    return positions[id];
                },
                /**
                 * Start a drag gesture to move/resize a frame.
                 *
                 * The provided position and dimensions factors will determine
                 * whether this is a move or a resize, and what type it
                 * will be. For instance, a position factor of [1, 1]
                 * will move a frame along with the mouse as the drag
                 * proceeds, while a dimension factor of [0, 0] will leave
                 * dimensions unchanged. Combining these in different
                 * ways results in different handles; a position factor of
                 * [1, 0] and a dimensions factor of [-1, 0] will implement
                 * a left-edge resize, as the horizontal position will move
                 * with the mouse while the horizontal dimensions shrink in
                 * kind (and vertical properties remain unmodified.)
                 *
                 * @param {string} id the identifier of the domain object
                 *        in the frame being manipulated
                 * @param {number[]} posFactor the position factor
                 * @param {number[]} dimFactor the dimensions factor
                 */
                startDrag: function (id, posFactor, dimFactor) {
                    activeDragId = id;
                    activeDrag = new LayoutDrag(
                        rawPositions[id],
                        posFactor,
                        dimFactor,
                        gridSize
                    );
                },
                /**
                 * Continue an active drag gesture.
                 * @param {number[]} delta the offset, in pixels,
                 *        of the current pointer position, relative
                 *        to its position when the drag started
                 */
                continueDrag: function (delta) {
                    if (activeDrag) {
                        rawPositions[activeDragId] =
                            activeDrag.getAdjustedPosition(delta);
                        populatePosition(activeDragId);
                    }
                },
                /**
                 * End the active drag gesture. This will update the
                 * view configuration.
                 */
                endDrag: function () {
                    // Write to configuration; this is watched and
                    // saved by the EditRepresenter.
                    $scope.configuration =
                        $scope.configuration || {};
                    // Make sure there is a "panels" field in the
                    // view configuration.
                    $scope.configuration.panels =
                        $scope.configuration.panels || {};
                    // Store the position of this panel.
                    $scope.configuration.panels[activeDragId] =
                        rawPositions[activeDragId];
                    // Mark this object as dirty to encourage persistence
                    if ($scope.commit) {
                        $scope.commit("Moved frame.");
                    }
                }
            };

        }

        return LayoutController;
    }
);