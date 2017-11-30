/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    [
        'lodash',
        './FixedProxy',
        './elements/ElementProxies',
        './FixedDragHandle',
        '../../../../src/api/objects/object-utils'
    ],
    function (
        _,
        FixedProxy,
        ElementProxies,
        FixedDragHandle,
        objectUtils
    ) {

        var DEFAULT_DIMENSIONS = [2, 1];

        /**
         * The FixedController is responsible for supporting the
         * Fixed Position view. It arranges frames according to saved
         * configuration and provides methods for updating these based on
         * mouse movement.
         * @memberof platform/features/layout
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function FixedController($scope, $q, dialogService, openmct) {
            this.names = {}; // Cache names by ID
            this.values = {}; // Cache values by ID
            this.elementProxiesById = {};

            this.telemetryObjects = [];
            this.subscriptions = [];
            this.openmct = openmct;
            this.$scope = $scope;

            this.gridSize = $scope.domainObject && $scope.domainObject.getModel().layoutGrid;

            var self = this;
            [
                'digest',
                'fetchHistoricalData',
                'getTelemetry',
                'setDisplayedValue',
                'subscribeToObjects',
                'unsubscribe',
                'updateView'
            ].forEach(function (name) {
                self[name] = self[name].bind(self);
            });

            // Convert from element x/y/width/height to an
            // appropriate ng-style argument, to position elements.
            function convertPosition(elementProxy) {
                var gridSize = elementProxy.getGridSize();
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
                var element = self.selection && self.selection.get();
                if (element) {
                    element.style = convertPosition(element);
                }
            }

            // Generate a specific drag handle
            function generateDragHandle(elementHandle) {
                return new FixedDragHandle(
                    elementHandle,
                    self.gridSize,
                    updateSelectionStyle,
                    $scope.commit
                );
            }

            // Generate drag handles for an element
            function generateDragHandles(element) {
                return element.handles().map(generateDragHandle);
            }

            // Update element positions when grid size changes
            function updateElementPositions(layoutGrid) {
                // Update grid size from model
                self.gridSize = layoutGrid;

                self.elementProxies.forEach(function (elementProxy) {
                    elementProxy.setGridSize(self.gridSize);
                    elementProxy.style = convertPosition(elementProxy);
                });
            }

            // Decorate an element for display
            function makeProxyElement(element, index, elements) {
                var ElementProxy = ElementProxies[element.type],
                    e = ElementProxy && new ElementProxy(element, index, elements, self.gridSize);

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
                var selected = self.selection && self.selection.get(),
                    elements = (($scope.configuration || {}).elements || []),
                    index = -1; // Start with a 'not-found' value

                // Find the selection in the new array
                if (selected !== undefined) {
                    index = elements.indexOf(selected.element);
                }

                // Create the new proxies...
                self.elementProxies = elements.map(makeProxyElement);

                // Clear old selection, and restore if appropriate
                if (self.selection) {
                    self.selection.deselect();
                    if (index > -1) {
                        self.select(self.elementProxies[index]);
                    }
                }

                // Finally, rebuild lists of elements by id to
                // facilitate faster update when new telemetry comes in.
                self.elementProxiesById = {};
                self.elementProxies.forEach(function (elementProxy) {
                    var id = elementProxy.id;
                    if (elementProxy.element.type === 'fixed.telemetry') {
                        // Provide it a cached name/value to avoid flashing
                        elementProxy.name = self.names[id];
                        elementProxy.value = self.values[id];
                        self.elementProxiesById[id] = self.elementProxiesById[id] || [];
                        self.elementProxiesById[id].push(elementProxy);
                    }
                });
            }

            function removeObjects(ids) {
                var configuration = self.$scope.configuration;

                if (configuration &&
                    configuration.elements) {
                    configuration.elements = configuration.elements.filter(function (proxy) {
                        return ids.indexOf(proxy.id) === -1;
                    });
                }
                self.getTelemetry($scope.domainObject);
                refreshElements();
                // Mark change as persistable
                if (self.$scope.commit) {
                    self.$scope.commit("Objects removed.");
                }
            }

            // Handle changes in the object's composition
            function updateComposition(composition, previousComposition) {
                var removedIds = [];
                // Resubscribe - objects in view have changed
                if (composition !== previousComposition) {
                    //remove any elements no longer in the composition
                    removedIds = _.difference(previousComposition, composition);
                    if (removedIds.length > 0) {
                        removeObjects(removedIds);
                    }
                }
            }

            // Trigger a new query for telemetry data
            function updateDisplayBounds(bounds, isTick) {
                if (!isTick) {
                    //Reset values
                    self.values = {};
                    refreshElements();
                    //Fetch new data
                    self.fetchHistoricalData(self.telemetryObjects);
                }
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
                self.select(
                    self.elementProxies[self.elementProxies.length - 1]
                );
                // Mark change as persistable
                if ($scope.commit) {
                    $scope.commit("Dropped an element.");
                }
            }

            // Position a panel after a drop event
            function handleDrop(e, id, position) {
                // Don't handle this event if it has already been handled
                // color is set to "" to let the CSS theme determine the default color
                if (e.defaultPrevented) {
                    return;
                }

                e.preventDefault();
                // Store the position of this element.
                addElement({
                    type: "fixed.telemetry",
                    x: Math.floor(position.x / self.gridSize[0]),
                    y: Math.floor(position.y / self.gridSize[1]),
                    id: id,
                    stroke: "transparent",
                    color: "",
                    titled: true,
                    width: DEFAULT_DIMENSIONS[0],
                    height: DEFAULT_DIMENSIONS[1],
                    useGrid: true
                });

                //Re-initialize objects, and subscribe to new object
                self.getTelemetry($scope.domainObject);
            }

            this.elementProxies = [];
            this.generateDragHandle = generateDragHandle;
            this.generateDragHandles = generateDragHandles;

            // Track current selection state
            $scope.$watch("selection", function (selection) {
                this.selection = selection;

                // Expose the view's selection proxy
                if (this.selection) {
                    this.selection.proxy(
                        new FixedProxy(addElement, $q, dialogService)
                    );
                }
            }.bind(this));

            // Detect changes to grid size
            $scope.$watch("model.layoutGrid", updateElementPositions);

            // Position panes where they are dropped
            $scope.$on("mctDrop", handleDrop);

            // Position panes when the model field changes
            $scope.$watch("model.composition", updateComposition);

            // Refresh list of elements whenever model changes
            $scope.$watch("model.modified", refreshElements);

            // Subscribe to telemetry when an object is available
            $scope.$watch("domainObject", this.getTelemetry);

            // Free up subscription on destroy
            $scope.$on("$destroy", function () {
                self.unsubscribe();
                self.openmct.time.off("bounds", updateDisplayBounds);
            });

            // Respond to external bounds changes
            this.openmct.time.on("bounds", updateDisplayBounds);
        }

        /**
         * A rate-limited digest function. Caps digests at 60Hz
         * @private
         */
        FixedController.prototype.digest = function () {
            var self = this;

            if (!this.digesting) {
                this.digesting = true;
                requestAnimationFrame(function () {
                    self.$scope.$digest();
                    self.digesting = false;
                });
            }
        };

        /**
         * Unsubscribe all listeners
         * @private
         */
        FixedController.prototype.unsubscribe = function () {
            this.subscriptions.forEach(function (unsubscribeFunc) {
                unsubscribeFunc();
            });
            this.subscriptions = [];
            this.telemetryObjects = [];
        };

        /**
         * Subscribe to all given domain objects
         * @private
         * @param {object[]} objects  Domain objects to subscribe to
         * @returns {object[]} The provided objects, for chaining.
         */
        FixedController.prototype.subscribeToObjects = function (objects) {
            var self = this;
            var timeAPI = this.openmct.time;

            this.subscriptions = objects.map(function (object) {
                return self.openmct.telemetry.subscribe(object, function (datum) {
                    if (timeAPI.clock() !== undefined) {
                        self.updateView(object, datum);
                    }
                }, {});
            });
            return objects;
        };

        /**
         * Print the values from the given datum against the provided object in the view.
         * @private
         * @param {object} telemetryObject The domain object associated with the given telemetry data
         * @param {object} datum The telemetry datum containing the values to print
         */
        FixedController.prototype.updateView = function (telemetryObject, datum) {
            var metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            var telemetryKeyToDisplay = this.chooseTelemetryKeyToDisplay(metadata);
            var formattedTelemetryValue = this.getFormattedTelemetryValueForKey(telemetryKeyToDisplay, datum, metadata);
            var limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            var alarm = limitEvaluator && limitEvaluator.evaluate(datum, telemetryKeyToDisplay);

            this.setDisplayedValue(
                telemetryObject,
                formattedTelemetryValue,
                alarm && alarm.cssClass
            );
            this.digest();
        };

        /**
         * @private
         */
        FixedController.prototype.getFormattedTelemetryValueForKey = function (telemetryKeyToDisplay, datum, metadata) {
            var valueMetadata = metadata.value(telemetryKeyToDisplay);
            var formatter = this.openmct.telemetry.getValueFormatter(valueMetadata);

            return formatter.format(datum[valueMetadata.key]);
        };

        /**
         * @private
         */
        FixedController.prototype.chooseTelemetryKeyToDisplay = function (metadata) {
            // If there is a range value, show that preferentially
            var telemetryKeyToDisplay = metadata.valuesForHints(['range'])[0];

            // If no range is defined, default to the highest priority non time-domain data.
            if (telemetryKeyToDisplay === undefined) {
                var valuesOrderedByPriority = metadata.values();
                telemetryKeyToDisplay = valuesOrderedByPriority.filter(function (valueMetadata) {
                    return !(valueMetadata.hints.domain);
                })[0];
            }

            return telemetryKeyToDisplay.source;
        };

        /**
         * Request the last historical data point for the given domain objects
         * @param {object[]} objects
         * @returns {object[]} the provided objects for chaining.
         */
        FixedController.prototype.fetchHistoricalData = function (objects) {
            var bounds = this.openmct.time.bounds();
            var self = this;

            objects.forEach(function (object) {
                self.openmct.telemetry.request(object, {start: bounds.start, end: bounds.end, size: 1})
                    .then(function (data) {
                        if (data.length > 0) {
                            self.updateView(object, data[data.length - 1]);
                        }
                    });
            });
            return objects;
        };


        /**
         * Print a value to the onscreen element associated with a given telemetry object.
         * @private
         * @param {object} telemetryObject The telemetry object associated with the value
         * @param {string | number} value The value to print to screen
         * @param {string} [cssClass] an optional CSS class to apply to the onscreen element.
         */
        FixedController.prototype.setDisplayedValue = function (telemetryObject, value, cssClass) {
            var id = objectUtils.makeKeyString(telemetryObject.identifier);
            var self = this;

            (self.elementProxiesById[id] || []).forEach(function (element) {
                self.names[id] = telemetryObject.name;
                self.values[id] = value;
                element.name = self.names[id];
                element.value = self.values[id];
                element.cssClass = cssClass;
            });
        };

        FixedController.prototype.getTelemetry = function (domainObject) {
            var newObject = domainObject.useCapability('adapter');
            var self = this;

            if (this.subscriptions.length > 0) {
                this.unsubscribe();
            }

            function filterForTelemetryObjects(objects) {
                return objects.filter(function (object) {
                    return self.openmct.telemetry.canProvideTelemetry(object);
                });
            }

            function initializeDisplay(objects) {
                self.telemetryObjects = objects;
                objects.forEach(function (object) {
                    // Initialize values
                    self.setDisplayedValue(object, "");
                });
                return objects;
            }

            return this.openmct.composition.get(newObject).load()
                .then(filterForTelemetryObjects)
                .then(initializeDisplay)
                .then(this.fetchHistoricalData)
                .then(this.subscribeToObjects);
        };

        /**
         * Get the size of the grid, in pixels. The returned array
         * is in the form `[x, y]`.
         * @returns {number[]} the grid size
         * @memberof platform/features/layout.FixedController#
         */
        FixedController.prototype.getGridSize = function () {
            return this.gridSize;
        };

        /**
         * Get an array of elements in this panel; these are
         * decorated proxies for both selection and display.
         * @returns {Array} elements in this panel
         */
        FixedController.prototype.getElements = function () {
            return this.elementProxies;
        };

        /**
         * Check if the element is currently selected, or (if no
         * argument is supplied) get the currently selected element.
         * @returns {boolean} true if selected
         */
        FixedController.prototype.selected = function (element) {
            var selection = this.selection;
            return selection && ((arguments.length > 0) ?
                    selection.selected(element) : selection.get());
        };

        /**
         * Set the active user selection in this view.
         * @param element the element to select
         */
        FixedController.prototype.select = function select(element, event) {
            if (event) {
                event.stopPropagation();
            }

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
        FixedController.prototype.clearSelection = function () {
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
        FixedController.prototype.handles = function () {
            return this.resizeHandles;
        };

        /**
         * Get the handle to handle dragging to reposition an element.
         * @returns {platform/features/layout.FixedDragHandle} the drag handle
         */
        FixedController.prototype.moveHandle = function () {
            return this.mvHandle;
        };

        return FixedController;
    }
);
