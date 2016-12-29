/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ['./FixedProxy', './elements/ElementProxies', './FixedDragHandle'],
    (FixedProxy, ElementProxies, FixedDragHandle) => {

        let DEFAULT_DIMENSIONS = [2, 1];

        /**
         * The FixedController is responsible for supporting the
         * Fixed Position view. It arranges frames according to saved
         * configuration and provides methods for updating these based on
         * mouse movement.
         * @memberof platform/features/layout
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        class FixedController {
          constructor($scope, $q, dialogService, telemetryHandler, telemetryFormatter) {
            let handle,
                names = {}, // Cache names by ID
                values = {}, // Cache values by ID
                elementProxiesById = {},
                maxDomainValue = Number.POSITIVE_INFINITY;

            // Convert from element x/y/width/height to an
            // appropriate ng-style argument, to position elements.
            const convertPosition = (elementProxy) => {
                let gridSize = this.gridSize;
                // Multiply position/dimensions by grid size
                return {
                    left: (gridSize[0] * elementProxy.x()) + 'px',
                    top: (gridSize[1] * elementProxy.y()) + 'px',
                    width: (gridSize[0] * elementProxy.width()) + 'px',
                    height: (gridSize[1] * elementProxy.height()) + 'px'
                };
            }

            // Update the style for a selected element
            const updateSelectionStyle = () => {
                var element = this.selection && this.selection.get();
                if (element) {
                    element.style = convertPosition(element);
                }
            }

            // Generate a specific drag handle
            const generateDragHandle = (elementHandle) => {
                return new FixedDragHandle(
                    elementHandle,
                    this.gridSize,
                    updateSelectionStyle,
                    $scope.commit
                );
            }

            // Generate drag handles for an element
            const generateDragHandles = (element) => {
                return element.handles().map(generateDragHandle);
            }

            // Update the value displayed in elements of this telemetry object
            const setDisplayedValue = (telemetryObject, value, alarm) => {
                let id = telemetryObject.getId();
                (elementProxiesById[id] || []).forEach( (element) => {
                    names[id] = telemetryObject.getModel().name;
                    values[id] = telemetryFormatter.formatRangeValue(value);
                    element.name = names[id];
                    element.value = values[id];
                    element.cssClass = alarm && alarm.cssClass;
                });
            }

            // Update the displayed value for this object, from a specific
            // telemetry series
            const updateValueFromSeries = (telemetryObject, telemetrySeries) => {
                let index = telemetrySeries.getPointCount() - 1,
                    limit = telemetryObject &&
                        telemetryObject.getCapability('limit'),
                    datum = telemetryObject && handle.getDatum(
                        telemetryObject,
                        index
                    );

                if (index >= 0) {
                    setDisplayedValue(
                        telemetryObject,
                        telemetrySeries.getRangeValue(index),
                        limit && datum && limit.evaluate(datum)
                    );
                }
            }

            // Update the displayed value for this object
            const updateValue = (telemetryObject) => {
                let limit = telemetryObject &&
                        telemetryObject.getCapability('limit'),
                    datum = telemetryObject &&
                        handle.getDatum(telemetryObject);

                if (telemetryObject &&
                        (handle.getDomainValue(telemetryObject) < maxDomainValue)) {
                    setDisplayedValue(
                        telemetryObject,
                        handle.getRangeValue(telemetryObject),
                        limit && datum && limit.evaluate(datum)
                    );
                }
            }

            // Update element positions when grid size changes
            const updateElementPositions = (layoutGrid) => {
                // Update grid size from model
                this.gridSize = layoutGrid;

                this.elementProxies.forEach( (elementProxy) => {
                    elementProxy.style = convertPosition(elementProxy);
                });
            }

            // Update telemetry values based on new data available
            const updateValues = () => {
                if (handle) {
                    handle.getTelemetryObjects().forEach(updateValue);
                }
            }

            // Decorate an element for display
            const makeProxyElement = (element, index, elements) => {
                let ElementProxy = ElementProxies[element.type],
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
            const refreshElements = () => {
                // Cache selection; we are instantiating new proxies
                // so we may want to restore this.
                let selected = this.selection && this.selection.get(),
                    elements = (($scope.configuration || {}).elements || []),
                    index = -1; // Start with a 'not-found' value

                // Find the selection in the new array
                if (selected !== undefined) {
                    index = elements.indexOf(selected.element);
                }

                // Create the new proxies...
                this.elementProxies = elements.map(makeProxyElement);

                // Clear old selection, and restore if appropriate
                if (this.selection) {
                    this.selection.deselect();
                    if (index > -1) {
                        this.select(this.elementProxies[index]);
                    }
                }

                // Finally, rebuild lists of elements by id to
                // facilitate faster update when new telemetry comes in.
                elementProxiesById = {};
                this.elementProxies.forEach( (elementProxy) => {
                    let id = elementProxy.id;
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
            const releaseSubscription = () => {
                if (handle) {
                    handle.unsubscribe();
                    handle = undefined;
                }
            }

            // Subscribe to telemetry updates for this domain object
            const subscribe = (domainObject) => {
                // Release existing subscription (if any)
                if (handle) {
                    handle.unsubscribe();
                }

                // Make a new subscription
                handle = domainObject && telemetryHandler.handle(
                    domainObject,
                    updateValues
                );
                // Request an initial historical telemetry value
                handle.request(
                    { size: 1 }, // Only need a single data point
                    updateValueFromSeries
                );
            }

            // Handle changes in the object's composition
            const updateComposition = () => {
                // Populate panel positions
                // TODO: Ensure defaults here
                // Resubscribe - objects in view have changed
                subscribe($scope.domainObject);
            }

            // Trigger a new query for telemetry data
            const updateDisplayBounds = (event, bounds) => {
                maxDomainValue = bounds.end;
                if (handle) {
                    handle.request(
                        { size: 1 }, // Only need a single data point
                        updateValueFromSeries
                    );
                }
            }

            // Add an element to this view
            const addElement = (element) => {
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
                this.select(
                    this.elementProxies[this.elementProxies.length - 1]
                );
                // Mark change as persistable
                if ($scope.commit) {
                    $scope.commit("Dropped an element.");
                }
            }

            // Position a panel after a drop event
            const handleDrop = (e, id, position) => {
                // Don't handle this event if it has already been handled
                // color is set to "" to let the CSS theme determine the default color
                if (e.defaultPrevented) {
                    return;
                }

                e.preventDefault();
                // Store the position of this element.
                addElement({
                    type: "fixed.telemetry",
                    x: Math.floor(position.x / this.gridSize[0]),
                    y: Math.floor(position.y / this.gridSize[1]),
                    id: id,
                    stroke: "transparent",
                    color: "",
                    titled: true,
                    width: DEFAULT_DIMENSIONS[0],
                    height: DEFAULT_DIMENSIONS[1]
                });
            }

            this.elementProxies = [];
            this.generateDragHandle = generateDragHandle;
            this.generateDragHandles = generateDragHandles;

            // Track current selection state
            $scope.$watch("selection", (selection) => {
                this.selection = selection;

                // Expose the view's selection proxy
                if (this.selection) {
                    this.selection.proxy(
                        new FixedProxy(addElement, $q, dialogService)
                    );
                }
            });

            // Detect changes to grid size
            $scope.$watch("model.layoutGrid", updateElementPositions);

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

            // Respond to external bounds changes
            $scope.$on("telemetry:display:bounds", updateDisplayBounds);
        }

        /**
         * Get the size of the grid, in pixels. The returned array
         * is in the form `[x, y]`.
         * @returns {number[]} the grid size
         * @memberof platform/features/layout.FixedController#
         */
        getGridSize() {
            return this.gridSize;
        };

        /**
         * Get an array of elements in this panel; these are
         * decorated proxies for both selection and display.
         * @returns {Array} elements in this panel
         */
        getElements() {
            return this.elementProxies;
        };

        /**
         * Check if the element is currently selected, or (if no
         * argument is supplied) get the currently selected element.
         * @returns {boolean} true if selected
         */
        selected(element) {
            let selection = this.selection;
            return selection && ((arguments.length > 0) ?
                    selection.selected(element) : selection.get());
        };

        /**
         * Set the active user selection in this view.
         * @param element the element to select
         */
        select(element) {
            if (this.selection) {
                // Update selection...
                this.selection.select(element);
                // ...as well as move, resize handles
                this.mvHandle = this.generateDragHandle(element);
                this.resizeHandles = this.generateDragHandles(element);
            }
        };

        /**
         * Clear the current user selection.
         */
        clearSelection() {
            if (this.selection) {
                this.selection.deselect();
                this.resizeHandles = [];
                this.mvHandle = undefined;
            }
        };

        /**
         * Get drag handles.
         * @returns {platform/features/layout.FixedDragHandle[]}
         *          drag handles for the current selection
         */
        handles() {
            return this.resizeHandles;
        };

        /**
         * Get the handle to handle dragging to reposition an element.
         * @returns {platform/features/layout.FixedDragHandle} the drag handle
         */
        moveHandle() {
            return this.mvHandle;
        };
      }
        return FixedController;
    }
);

