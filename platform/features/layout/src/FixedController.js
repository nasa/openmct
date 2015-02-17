/*global define*/

define(
    ['./LayoutDrag'],
    function (LayoutDrag) {
        "use strict";

        var DEFAULT_DIMENSIONS = [ 2, 1 ],
            DEFAULT_GRID_SIZE = [64, 16],
            DEFAULT_GRID_EXTENT = [4, 4];

        /**
         * The FixedController is responsible for supporting the
         * Fixed Position view. It arranges frames according to saved
         * configuration and provides methods for updating these based on
         * mouse movement.
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function FixedController($scope, telemetrySubscriber, telemetryFormatter) {
            var gridSize = DEFAULT_GRID_SIZE,
                gridExtent = DEFAULT_GRID_EXTENT,
                activeDrag,
                activeDragId,
                subscription,
                values = {},
                cellStyles = [],
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

            // Refresh cell styles (e.g. because grid extent changed)
            function refreshCellStyles() {
                var x, y;

                cellStyles = [];

                for (x = 0; x < gridExtent[0]; x += 1) {
                    for (y = 0; y < gridExtent[1]; y += 1) {
                        // Position blocks; subtract out border size from w/h
                        cellStyles.push({
                            left: x * gridSize[0] + 'px',
                            top: y * gridSize[1] + 'px',
                            width: gridSize[0] - 1 + 'px',
                            height: gridSize[1] - 1 + 'px'
                        });
                    }
                }
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
            function lookupPanels(ids) {
                var configuration = $scope.configuration || {};
                ids = ids || [];

                // Pull panel positions from configuration
                rawPositions = shallowCopy(configuration.elements || {}, ids);

                // Clear prior computed positions
                positions = {};

                // Update width/height that we are tracking
                gridSize = ($scope.model || {}).layoutGrid || DEFAULT_GRID_SIZE;

                // Compute positions and add defaults where needed
                ids.forEach(populatePosition);
            }

            // Update the displayed value for this object
            function updateValue(telemetryObject) {
                var id = telemetryObject && telemetryObject.getId();
                if (id) {
                    values[id] = telemetryFormatter.formatRangeValue(
                        subscription.getRangeValue(telemetryObject)
                    );
                }
            }

            // Update telemetry values based on new data available
            function updateValues() {
                if (subscription) {
                    subscription.getTelemetryObjects().forEach(updateValue);
                }
            }

            // Free up subscription to telemetry
            function releaseSubscription() {
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = undefined;
                }
            }

            // Subscribe to telemetry updates for this domain object
            function subscribe(domainObject) {
                // Clear any old values
                values = {};

                // Release existing subscription (if any)
                if (subscription) {
                    subscription.unsubscribe();
                }

                // Make a new subscription
                subscription = domainObject &&
                    telemetrySubscriber.subscribe(domainObject, updateValues);
            }

            // Handle changes in the object's composition
            function updateComposition(ids) {
                // Populate panel positions
                lookupPanels(ids);
                // Resubscribe - objects in view have changed
                subscribe($scope.domainObject);
            }

            // Position a panel after a drop event
            function handleDrop(e, id, position) {
                // Make sure there is a "elements" field in the
                // view configuration.
                $scope.configuration.elements =
                    $scope.configuration.elements || {};
                // Store the position of this element.
                $scope.configuration.elements[id] = {
                    position: [
                        Math.floor(position.x / gridSize[0]),
                        Math.floor(position.y / gridSize[1])
                    ],
                    dimensions: DEFAULT_DIMENSIONS
                };
                // Mark change as persistable
                if ($scope.commit) {
                    $scope.commit("Dropped a frame.");
                }
            }

            // Position panes when the model field changes
            $scope.$watch("model.composition", updateComposition);

            // Subscribe to telemetry when an object is available
            $scope.$watch("domainObject", subscribe);

            // Free up subscription on destroy
            $scope.$on("$destroy", releaseSubscription);

            // Position panes where they are dropped
            $scope.$on("mctDrop", handleDrop);

            // Initialize styles (position etc.) for cells
            refreshCellStyles();

            return {
                /**
                 * Get styles for all background cells, as will populate the
                 * ng-style tag.
                 * @memberof FixedController#
                 * @returns {Array} cell styles
                 */
                getCellStyles: function () {
                    return cellStyles;
                },
                /**
                 * Get the current data value for the specified domain object.
                 * @memberof FixedController#
                 * @param {string} id the domain object identifier
                 * @returns {string} the displayable data value
                 */
                getValue: function (id) {
                    return values[id];
                },
                /**
                 * Set the size of the viewable fixed position area.
                 * @memberof FixedController#
                 * @param bounds the width/height, as reported by mct-resize
                 */
                setBounds: function (bounds) {
                    var w = Math.ceil(bounds.width / gridSize[0]),
                        h = Math.ceil(bounds.height / gridSize[1]);
                    if (w !== gridExtent[0] || h !== gridExtent[1]) {
                        gridExtent = [w, h];
                        refreshCellStyles();
                    }
                },
                /**
                 * Get a style object for a frame with the specified domain
                 * object identifier, suitable for use in an `ng-style`
                 * directive to position a frame as configured for this layout.
                 * @param {string} id the object identifier
                 * @returns {Object.<string, string>} an object with
                 *          appropriate left, width, etc fields for positioning
                 */
                getStyle: function (id) {
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
                    $scope.configuration.elements =
                        $scope.configuration.elements || {};
                    // Store the position of this panel.
                    $scope.configuration.elements[activeDragId] =
                        rawPositions[activeDragId];
                    // Mark this object as dirty to encourage persistence
                    if ($scope.commit) {
                        $scope.commit("Moved element.");
                    }
                }
            };

        }

        return FixedController;
    }
);