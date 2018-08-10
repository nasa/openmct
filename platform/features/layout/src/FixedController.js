/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

        // Convert from element x/y/width/height to an
        // appropriate ng-style argument, to position elements.
        function convertPosition(elementProxy) {
            if (elementProxy.getStyle) {
                return elementProxy.getStyle();
            }

            var gridSize = elementProxy.getGridSize();

            // Multiply position/dimensions by grid size
            return {
                left: (gridSize[0] * elementProxy.element.x) + 'px',
                top: (gridSize[1] * elementProxy.element.y) + 'px',
                width: (gridSize[0] * elementProxy.element.width) + 'px',
                height: (gridSize[1] * elementProxy.element.height) + 'px'
            };
        }

        /**
         * The FixedController is responsible for supporting the
         * Fixed Position view. It arranges frames according to saved
         * configuration and provides methods for updating these based on
         * mouse movement.
         * @memberof platform/features/layout
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function FixedController($scope, $q, dialogService, openmct, $element) {
            this.names = {}; // Cache names by ID
            this.values = {}; // Cache values by ID
            this.elementProxiesById = {};
            this.telemetryObjects = {};
            this.subscriptions = {};
            this.openmct = openmct;
            this.$element = $element;
            this.$scope = $scope;
            this.dialogService = dialogService;
            this.$q = $q;
            this.newDomainObject = $scope.domainObject.useCapability('adapter');
            this.fixedViewSelectable = false;

            var self = this;
            [
                'digest',
                'fetchHistoricalData',
                'getTelemetry',
                'setDisplayedValue',
                'subscribeToObject',
                'unsubscribe',
                'updateView',
                'setSelection'
            ].forEach(function (name) {
                self[name] = self[name].bind(self);
            });

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
                var elements = (((self.newDomainObject.configuration || {})['fixed-display'] || {}).elements || []);

                // Create the new proxies...
                self.elementProxies = elements.map(makeProxyElement);

                if (self.selectedElementProxy) {
                    // If selection is not in array, select parent.
                    // Otherwise, set the element to select after refresh.
                    var index = elements.indexOf(self.selectedElementProxy.element);
                    if (index === -1) {
                        self.$element[0].click();
                    } else if (!self.elementToSelectAfterRefresh) {
                        self.elementToSelectAfterRefresh = self.elementProxies[index].element;
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

            // Trigger a new query for telemetry data
            function updateDisplayBounds(bounds, isTick) {
                if (!isTick) {
                    //Reset values
                    self.values = {};
                    refreshElements();

                    //Fetch new data
                    Object.values(self.telemetryObjects).forEach(function (object) {
                        self.fetchHistoricalData(object);
                    });
                }
            }

            // Add an element to this view
            function addElement(element) {
                var index;
                var elements = (((self.newDomainObject.configuration || {})['fixed-display'] || {}).elements || []);
                elements.push(element);

                if (self.selectedElementProxy) {
                    index = elements.indexOf(self.selectedElementProxy.element);
                }

                self.mutate("configuration['fixed-display'].elements", elements);
                elements = (self.newDomainObject.configuration)['fixed-display'].elements || [];
                self.elementToSelectAfterRefresh = elements[elements.length - 1];

                if (self.selectedElementProxy) {
                    // Update the selected element with the new
                    // value since newDomainOject is mutated.
                    self.selectedElementProxy.element = elements[index];
                }
                refreshElements();
            }

            // Position a panel after a drop event
            function handleDrop(e, id, position) {
                // Don't handle this event if it has already been handled
                if (e.defaultPrevented) {
                    return;
                }

                e.preventDefault();

                // Store the position of this element.
                // color is set to "" to let the CSS theme determine the default color
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

                // Subscribe to the new object to get telemetry
                self.openmct.objects.get(id).then(function (object) {
                    self.getTelemetry(object);
                });
            }

            this.elementProxies = [];
            this.addElement = addElement;
            this.refreshElements = refreshElements;
            this.fixedProxy = new FixedProxy(this.addElement, this.$q, this.dialogService);

            this.composition = this.openmct.composition.get(this.newDomainObject);
            this.composition.on('add', this.onCompositionAdd, this);
            this.composition.on('remove', this.onCompositionRemove, this);
            this.composition.load();

            // Position panes where they are dropped
            $scope.$on("mctDrop", handleDrop);

            $scope.$on("$destroy", this.destroy.bind(this));

            // Respond to external bounds changes
            this.openmct.time.on("bounds", updateDisplayBounds);

            this.openmct.selection.on('change', this.setSelection);
            this.$element.on('click', this.bypassSelection.bind(this));
            this.unlisten = this.openmct.objects.observe(this.newDomainObject, '*', function (obj) {
                this.newDomainObject = JSON.parse(JSON.stringify(obj));
                this.updateElementPositions(this.newDomainObject.layoutGrid);
            }.bind(this));

            this.updateElementPositions(this.newDomainObject.layoutGrid);
            refreshElements();

            //force a click, to initialize Fixed Position Controller on SelectionAPI
            $element[0].click();
        }

        FixedController.prototype.updateElementPositions = function (layoutGrid) {
            this.gridSize = layoutGrid;

            this.elementProxies.forEach(function (elementProxy) {
                elementProxy.setGridSize(this.gridSize);
                elementProxy.style = convertPosition(elementProxy);
            }.bind(this));
        };

        FixedController.prototype.onCompositionAdd = function (object) {
            this.getTelemetry(object);
        };

        FixedController.prototype.onCompositionRemove = function (identifier) {
            // Defer mutation of newDomainObject to prevent mutating an
            // outdated version since this is triggered by a composition change.
            setTimeout(function () {
                var id = objectUtils.makeKeyString(identifier);
                var elements = this.newDomainObject.configuration['fixed-display'].elements || [];
                var newElements = elements.filter(function (proxy) {
                    return proxy.id !== id;
                });
                this.mutate("configuration['fixed-display'].elements", newElements);

                if (this.subscriptions[id]) {
                    this.subscriptions[id]();
                    delete this.subscriptions[id];
                }

                delete this.telemetryObjects[id];
                this.refreshElements();
            }.bind(this));
        };

        /**
         * Removes an element from the view.
         *
         * @param {Object} elementProxy the element proxy to remove.
         */
        FixedController.prototype.remove = function (elementProxy) {
            var element = elementProxy.element;
            var elements = this.newDomainObject.configuration['fixed-display'].elements || [];
            elements.splice(elements.indexOf(element), 1);

            if (element.type === 'fixed.telemetry') {
                this.newDomainObject.composition = this.newDomainObject.composition.filter(function (identifier) {
                    return objectUtils.makeKeyString(identifier) !== element.id;
                });
            }

            this.mutate("configuration['fixed-display'].elements", elements);
            this.refreshElements();

        };

        /**
         * Adds a new element to the view.
         *
         * @param {string} type the type of element to add. Supported types are:
         * `fixed.image`
         * `fixed.box`
         * `fixed.text`
         * `fixed.line`
         */
        FixedController.prototype.add = function (type) {
            this.fixedProxy.add(type);
        };

        /**
         * Change the display order of the element proxy.
         */
        FixedController.prototype.order = function (elementProxy, position) {
            var elements = elementProxy.order(position);

            // Find the selected element index in the updated array.
            var selectedElemenetIndex = elements.indexOf(this.selectedElementProxy.element);

            this.mutate("configuration['fixed-display'].elements", elements);
            elements = (this.newDomainObject.configuration)['fixed-display'].elements || [];

            // Update the selected element with the new
            // value since newDomainOject is mutated.
            this.selectedElementProxy.element = elements[selectedElemenetIndex];
            this.refreshElements();
        };

        FixedController.prototype.generateDragHandle = function (elementProxy, elementHandle) {
            var index = this.elementProxies.indexOf(elementProxy);

            if (elementHandle) {
                elementHandle.element = elementProxy.element;
                elementProxy = elementHandle;
            }

            return new FixedDragHandle(
                elementProxy,
                "configuration['fixed-display'].elements[" + index + "]",
                this
            );
        };

        FixedController.prototype.generateDragHandles = function (elementProxy) {
            return elementProxy.handles().map(function (handle) {
                return this.generateDragHandle(elementProxy, handle);
            }, this);
        };

        FixedController.prototype.updateSelectionStyle = function () {
            this.selectedElementProxy.style = convertPosition(this.selectedElementProxy);
        };

        FixedController.prototype.setSelection = function (selectable) {
            var selection = selectable[0];

            if (this.selectionListeners) {
                this.selectionListeners.forEach(function (l) {
                    l();
                });
            }

            this.selectionListeners = [];

            if (!selection) {
                return;
            }

            if (selection.context.elementProxy) {
                this.selectedElementProxy = selection.context.elementProxy;
                this.attachSelectionListeners();
                this.mvHandle = this.generateDragHandle(this.selectedElementProxy);
                this.resizeHandles = this.generateDragHandles(this.selectedElementProxy);
            } else {
                // Make fixed view selectable if it's not already.
                if (!this.fixedViewSelectable && selectable.length === 1) {
                    this.fixedViewSelectable = true;
                    selection.context.fixedController = this;
                    this.openmct.selection.select(selection);
                }

                this.resizeHandles = [];
                this.mvHandle = undefined;
                this.selectedElementProxy = undefined;
            }
        };

        FixedController.prototype.attachSelectionListeners = function () {
            var index = this.elementProxies.indexOf(this.selectedElementProxy);
            var path = "configuration['fixed-display'].elements[" + index + "]";

            this.selectionListeners.push(this.openmct.objects.observe(this.newDomainObject, path + ".useGrid", function (newValue) {
                if (this.selectedElementProxy.useGrid() !== newValue) {
                    this.selectedElementProxy.useGrid(newValue);
                    this.updateSelectionStyle();
                    this.openmct.objects.mutate(this.newDomainObject, path, this.selectedElementProxy.element);
                }
            }.bind(this)));
            [
                "width",
                "height",
                "stroke",
                "fill",
                "x",
                "y",
                "x1",
                "y1",
                "x2",
                "y2",
                "color",
                "size",
                "text",
                "titled"
            ].forEach(function (property) {
                this.selectionListeners.push(this.openmct.objects.observe(this.newDomainObject, path + "." + property, function (newValue) {
                    this.selectedElementProxy.element[property] = newValue;
                    this.updateSelectionStyle();
                }.bind(this)));
            }.bind(this));
        };

        FixedController.prototype.destroy = function () {
            this.unsubscribe();
            this.unlisten();
            this.openmct.time.off("bounds", this.updateDisplayBounds);
            this.openmct.selection.off("change", this.setSelection);
            this.composition.off('add', this.onCompositionAdd, this);
            this.composition.off('remove', this.onCompositionRemove, this);
        };

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
            Object.values(this.subscriptions).forEach(function (unsubscribeFunc) {
                unsubscribeFunc();
            });
            this.subscriptions = {};
            this.telemetryObjects = {};
        };

        /**
         * Subscribe to the given domain object
         * @private
         * @param {object} object  Domain object to subscribe to
         * @returns {object} The provided object, for chaining.
         */
        FixedController.prototype.subscribeToObject = function (object) {
            var self = this;
            var timeAPI = this.openmct.time;
            var id = objectUtils.makeKeyString(object.identifier);
            this.subscriptions[id] = self.openmct.telemetry.subscribe(object, function (datum) {
                if (timeAPI.clock() !== undefined) {
                    self.updateView(object, datum);
                }
            }, {});

            return object;
        };

        /**
         * Print the values from the given datum against the provided object in the view.
         * @private
         * @param {object} telemetryObject The domain object associated with the given telemetry data
         * @param {object} datum The telemetry datum containing the values to print
         */
        FixedController.prototype.updateView = function (telemetryObject, datum) {
            var metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            var valueMetadata = this.chooseValueMetadataToDisplay(metadata);
            var formattedTelemetryValue = this.getFormattedTelemetryValueForKey(valueMetadata, datum);
            var limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            var alarm = limitEvaluator && limitEvaluator.evaluate(datum, valueMetadata);

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
        FixedController.prototype.getFormattedTelemetryValueForKey = function (valueMetadata, datum) {
            var formatter = this.openmct.telemetry.getValueFormatter(valueMetadata);

            return formatter.format(datum);
        };

        /**
         * @private
         */
        FixedController.prototype.chooseValueMetadataToDisplay = function (metadata) {
            // If there is a range value, show that preferentially
            var valueMetadata = metadata.valuesForHints(['range'])[0];

            // If no range is defined, default to the highest priority non time-domain data.
            if (valueMetadata === undefined) {
                var valuesOrderedByPriority = metadata.values();
                valueMetadata = valuesOrderedByPriority.filter(function (values) {
                    return !(values.hints.domain);
                })[0];
            }

            return valueMetadata;
        };

        /**
         * Request the last historical data point for the given domain object
         * @param {object} object
         * @returns {object} the provided object for chaining.
         */
        FixedController.prototype.fetchHistoricalData = function (object) {
            var bounds = this.openmct.time.bounds();
            var self = this;

            self.openmct.telemetry.request(object, {start: bounds.start, end: bounds.end, size: 1})
                .then(function (data) {
                    if (data.length > 0) {
                        self.updateView(object, data[data.length - 1]);
                    }
                });

            return object;
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
            var id = objectUtils.makeKeyString(domainObject.identifier);

            if (this.subscriptions[id]) {
                this.subscriptions[id]();
                delete this.subscriptions[id];
            }
            delete this.telemetryObjects[id];

            if (!this.openmct.telemetry.isTelemetryObject(domainObject)) {
                return;
            }

            // Initialize display
            this.telemetryObjects[id] = domainObject;
            this.setDisplayedValue(domainObject, "");

            return Promise.resolve(domainObject)
                .then(this.fetchHistoricalData)
                .then(this.subscribeToObject);
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
         * Checks if the element should be selected or not.
         *
         * @param elementProxy the element to check
         * @returns {boolean} true if the element should be selected.
         */
        FixedController.prototype.shouldSelect = function (elementProxy) {
            if (elementProxy.element === this.elementToSelectAfterRefresh) {
                delete this.elementToSelectAfterRefresh;
                return true;
            } else {
                return false;
            }
        };

        /**
         * Checks if an element is currently selected.
         *
         * @returns {boolean} true if an element is selected.
         */
        FixedController.prototype.isElementSelected = function () {
            return (this.selectedElementProxy) ? true : false;
        };

        /**
         * Gets the style for the selected element.
         *
         * @returns {string} element style
         */
        FixedController.prototype.getSelectedElementStyle = function () {
            return (this.selectedElementProxy) ? this.selectedElementProxy.style : undefined;
        };

        /**
         * Gets the selected element.
         *
         * @returns the selected element
         */
        FixedController.prototype.getSelectedElement = function () {
            return this.selectedElementProxy;
        };

        /**
         * Prevents the event from bubbling up if drag is in progress.
         */
        FixedController.prototype.bypassSelection = function ($event) {
            if (this.dragInProgress) {
                if ($event) {
                    $event.stopPropagation();
                }
                return;
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

        /**
         * Gets the selection context.
         *
         * @param elementProxy the element proxy
         * @returns {object} the context object which includes elementProxy
         */
        FixedController.prototype.getContext = function (elementProxy) {
            return {
                elementProxy: elementProxy,
                fixedController: this
            };
        };

        /**
         * End drag.
         *
         * @param handle the resize handle
         */
        FixedController.prototype.endDrag = function (handle) {
            this.dragInProgress = true;

            setTimeout(function () {
                this.dragInProgress = false;
            }.bind(this), 0);

            if (handle) {
                handle.endDrag();
            } else {
                this.moveHandle().endDrag();
            }
        };

        FixedController.prototype.mutate = function (path, value) {
            this.openmct.objects.mutate(this.newDomainObject, path, value);
        };

        return FixedController;
    }
);
