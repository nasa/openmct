/*global define*/

define(
    ['./LayoutDrag', './FixedProxy', './elements/ElementProxies'],
    function (LayoutDrag, FixedProxy, ElementProxies) {
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
        function FixedController($scope, $q, dialogService, telemetrySubscriber, telemetryFormatter) {
            var gridSize = DEFAULT_GRID_SIZE,
                gridExtent = DEFAULT_GRID_EXTENT,
                dragging,
                subscription,
                cellStyles = [],
                elementProxies = [],
                names = {}, // Cache names by ID
                values = {}, // Cache values by ID
                elementProxiesById = {},
                selection;

            // Refresh cell styles (e.g. because grid extent changed)
            function refreshCellStyles() {
                var x, y;

                // Clear previous styles
                cellStyles = [];

                // Update grid size from model
                gridSize = ($scope.model || {}).layoutGrid || gridSize;

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

            // Convert from element x/y/width/height to an
            // apropriate ng-style argument, to position elements.
            function convertPosition(elementProxy) {
                // Multiply position/dimensions by grid size
                return {
                    left: (gridSize[0] * elementProxy.x()) + 'px',
                    top: (gridSize[1] * elementProxy.y()) + 'px',
                    width: (gridSize[0] * elementProxy.width()) + 'px',
                    height: (gridSize[1] * elementProxy.height()) + 'px'
                };
            }

            // Update the displayed value for this object
            function updateValue(telemetryObject) {
                var id = telemetryObject && telemetryObject.getId();
                if (id) {
                    (elementProxiesById[id] || []).forEach(function (element) {
                        names[id] = telemetryObject.getModel().name;
                        values[id] = telemetryFormatter.formatRangeValue(
                            subscription.getRangeValue(telemetryObject)
                        );
                        element.name = names[id];
                        element.value = values[id];
                    });
                }
            }

            // Update telemetry values based on new data available
            function updateValues() {
                if (subscription) {
                    subscription.getTelemetryObjects().forEach(updateValue);
                }
            }

            // Decorate an element for display
            function makeProxyElement(element, index, elements) {
                var ElementProxy = ElementProxies[element.type],
                    e = ElementProxy && new ElementProxy(element, index, elements);

                if (e) {
                    // Provide a displayable position (convert from grid to px)
                    e.style = convertPosition(e);
                    // Template names are same as type names, presently
                    e.template = element.type;
                }

                return e;
            }

            // Decorate elements in the current configuration
            function refreshElements() {
                // Cache selection; we are instantiating new proxies
                // so we may want to restore this.
                var selected = selection && selection.get(),
                    elements = (($scope.configuration || {}).elements || []),
                    index = -1; // Start with a 'not-found' value

                // Find the selection in the new array
                if (selected !== undefined) {
                    index = elements.indexOf(selected.element);
                }

                // Create the new proxies...
                elementProxies = elements.map(makeProxyElement);

                // Clear old selection, and restore if appropriate
                if (selection) {
                    selection.deselect();
                    if (index > -1) {
                        selection.select(elementProxies[index]);
                    }
                }

                // Finally, rebuild lists of elements by id to
                // facilitate faster update when new telemetry comes in.
                elementProxiesById = {};
                elementProxies.forEach(function (elementProxy) {
                    var id = elementProxy.id;
                    if (elementProxy.element.type === 'fixed.telemetry') {
                        // Provide it a cached name/value to avoid flashing
                        elementProxy.name = names[id];
                        elementProxy.value = values[id];
                        elementProxiesById[id] = elementProxiesById[id] || [];
                        elementProxiesById[id].push(elementProxy);
                    }
                });

                // TODO: Ensure elements for all domain objects?
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
                // TODO: Ensure defaults here
                // Resubscribe - objects in view have changed
                subscribe($scope.domainObject);
            }

            // Add an element to this view
            function addElement(element) {
                // Ensure that configuration field is populated
                $scope.configuration = $scope.configuration || {};
                // Make sure there is a "elements" field in the
                // view configuration.
                $scope.configuration.elements =
                    $scope.configuration.elements || [];
                // Store the position of this element.
                $scope.configuration.elements.push(element);
                // Refresh displayed elements
                refreshElements();
                // Select the newly-added element
                if (selection) {
                    selection.select(elementProxies[elementProxies.length - 1]);
                }
                // Mark change as persistable
                if ($scope.commit) {
                    $scope.commit("Dropped an element.");
                }
            }

            // Position a panel after a drop event
            function handleDrop(e, id, position) {
                // Store the position of this element.
                addElement({
                    type: "fixed.telemetry",
                    x: Math.floor(position.x / gridSize[0]),
                    y: Math.floor(position.y / gridSize[1]),
                    id: id,
                    stroke: "transparent",
                    color: "#717171",
                    titled: true,
                    width: DEFAULT_DIMENSIONS[0],
                    height: DEFAULT_DIMENSIONS[1]
                });
            }

            // Track current selection state
            selection = $scope.selection;

            // Expose the view's selection proxy
            if (selection) {
                selection.proxy(new FixedProxy(addElement, $q, dialogService));
            }

            // Refresh list of elements whenever model changes
            $scope.$watch("model.modified", refreshElements);

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
                 * Get the size of the grid, in pixels. The returned array
                 * is in the form `[x, y]`.
                 * @returns {number[]} the grid size
                 */
                getGridSize: function () {
                    return gridSize;
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
                 * Get an array of elements in this panel; these are
                 * decorated proxies for both selection and display.
                 * @returns {Array} elements in this panel
                 */
                getElements: function () {
                    return elementProxies;
                },
                /**
                 * Check if the element is currently selected.
                 * @returns {boolean} true if selected
                 */
                selected: function (element) {
                    return selection && selection.selected(element);
                },
                /**
                 * Set the active user selection in this view.
                 * @param element the element to select
                 */
                select: function (element) {
                    if (selection) {
                        selection.select(element);
                    }
                },
                /**
                 * Clear the current user selection.
                 */
                clearSelection: function () {
                    if (selection) {
                        selection.deselect();
                    }
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
                 * @param element the raw (undecorated) element to drag
                 */
                startDrag: function (element) {
                    // Only allow dragging in edit mode
                    if ($scope.domainObject &&
                            $scope.domainObject.hasCapability('editor')) {
                        dragging = {
                            element: element,
                            x: element.x(),
                            y: element.y()
                        };
                    }
                },
                /**
                 * Continue an active drag gesture.
                 * @param {number[]} delta the offset, in pixels,
                 *        of the current pointer position, relative
                 *        to its position when the drag started
                 */
                continueDrag: function (delta) {
                    if (dragging) {
                        // Update x/y values
                        dragging.element.x(dragging.x + Math.round(delta[0] / gridSize[0]));
                        dragging.element.y(dragging.y + Math.round(delta[1] / gridSize[1]));
                        // Update display position
                        dragging.element.style = convertPosition(dragging.element);
                    }
                },
                /**
                 * End the active drag gesture. This will update the
                 * view configuration.
                 */
                endDrag: function () {
                    // Mark this object as dirty to encourage persistence
                    if (dragging && $scope.commit) {
                        dragging = undefined;
                        $scope.commit("Moved element.");
                    }
                }
            };

        }

        return FixedController;
    }
);