/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    ['./FixedProxy', './elements/ElementProxies', './FixedDragHandle'],
    function (FixedProxy, ElementProxies, FixedDragHandle) {
        "use strict";

        var DEFAULT_DIMENSIONS = [ 2, 1 ],
            DEFAULT_GRID_SIZE = [64, 16];

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
                dragging,
                subscription,
                elementProxies = [],
                names = {}, // Cache names by ID
                values = {}, // Cache values by ID
                elementProxiesById = {},
                handles = [],
                moveHandle,
                selection;

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

            // Update the style for a selected element
            function updateSelectionStyle() {
                var element = selection && selection.get();
                if (element) {
                    element.style = convertPosition(element);
                }
            }

            // Generate a specific drag handle
            function generateDragHandle(elementHandle) {
                return new FixedDragHandle(
                    elementHandle,
                    gridSize,
                    updateSelectionStyle,
                    $scope.commit
                );
            }

            // Generate drag handles for an element
            function generateDragHandles(element) {
                return element.handles().map(generateDragHandle);
            }

            // Select an element
            function select(element) {
                if (selection) {
                    // Update selection...
                    selection.select(element);
                    // ...as well as move, resize handles
                    moveHandle = generateDragHandle(element);
                    handles = generateDragHandles(element);
                }
            }

            // Update the displayed value for this object
            function updateValue(telemetryObject) {
                var id = telemetryObject && telemetryObject.getId(),
                    limit = telemetryObject &&
                        telemetryObject.getCapability('limit'),
                    datum = telemetryObject &&
                        subscription.getDatum(telemetryObject),
                    alarm = limit && datum && limit.evaluate(datum);

                if (id) {
                    (elementProxiesById[id] || []).forEach(function (element) {
                        names[id] = telemetryObject.getModel().name;
                        values[id] = telemetryFormatter.formatRangeValue(
                            subscription.getRangeValue(telemetryObject)
                        );
                        element.name = names[id];
                        element.value = values[id];
                        element.cssClass = alarm && alarm.cssClass;
                    });
                }
            }

            // Update element positions when grid size changes
            function updateElementPositions(layoutGrid) {
                // Update grid size from model
                gridSize = layoutGrid || DEFAULT_GRID_SIZE;

                elementProxies.forEach(function (elementProxy) {
                    elementProxy.style = convertPosition(elementProxy);
                });
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
                        select(elementProxies[index]);
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
                select(elementProxies[elementProxies.length - 1]);
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
                    color: "#cccccc",
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

            // Detect changes to grid size
            $scope.$watch("model.layoutGrid", updateElementPositions);

            // Subscribe to telemetry when an object is available
            $scope.$watch("domainObject", subscribe);

            // Free up subscription on destroy
            $scope.$on("$destroy", releaseSubscription);

            // Position panes where they are dropped
            $scope.$on("mctDrop", handleDrop);

            return {
                /**
                 * Get the size of the grid, in pixels. The returned array
                 * is in the form `[x, y]`.
                 * @returns {number[]} the grid size
                 */
                getGridSize: function () {
                    return gridSize;
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
                 * Check if the element is currently selected, or (if no
                 * argument is supplied) get the currently selected element.
                 * @returns {boolean} true if selected
                 */
                selected: function (element) {
                    return selection && ((arguments.length > 0) ?
                            selection.selected(element) : selection.get());
                },
                /**
                 * Set the active user selection in this view.
                 * @param element the element to select
                 */
                select: select,
                /**
                 * Clear the current user selection.
                 */
                clearSelection: function () {
                    if (selection) {
                        selection.deselect();
                        handles = [];
                        moveHandle = undefined;
                    }
                },
                /**
                 * Get drag handles.
                 * @returns {Array} drag handles for the current selection
                 */
                handles: function () {
                    return handles;
                },
                /**
                 * Get the handle to handle dragging to reposition an element.
                 * @returns {FixedDragHandle} the drag handle
                 */
                moveHandle: function () {
                    return moveHandle;
                }
            };

        }

        return FixedController;
    }
);
