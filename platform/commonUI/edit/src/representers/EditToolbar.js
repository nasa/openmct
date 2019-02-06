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
        '../../../../../src/api/objects/object-utils',
        'lodash'
    ],
    function (
        objectUtils,
        _
    ) {

        /**
         * Provides initial structure and state (as suitable for provision
         * to the `mct-toolbar` directive) for a view's toolbar, based on
         * that view's declaration of what belongs in its toolbar and on
         * the current selection.
         *
         * @param $scope the Angular scope
         * @param {Object} openmct the openmct object
         * @param structure the toolbar structure
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditToolbar($scope, openmct, structure) {
            this.toolbarStructure = [];
            this.properties = [];
            this.toolbarState = [];
            this.openmct = openmct;
            this.domainObjectsById = {};
            this.unobserveObjects = [];
            this.stateTracker = [];

            $scope.$watchCollection(this.getState.bind(this), this.handleStateChanges.bind(this));
            $scope.$on("$destroy", this.destroy.bind(this));

            this.updateToolbar(structure);
            this.registerListeners(structure);
        }

        /**
         * Updates the toolbar with a new structure.
         *
         * @param {Array} structure the toolbar structure
         */
        EditToolbar.prototype.updateToolbar = function (structure) {
            var self = this;

            function addKey(item) {
                self.stateTracker.push({
                    id: objectUtils.makeKeyString(item.domainObject.identifier),
                    domainObject: item.domainObject,
                    property: item.property
                });
                self.properties.push(item.property);

                return self.properties.length - 1; // Return index of property
            }

            function convertItem(item) {
                var converted = Object.create(item || {});

                if (item.property) {
                    converted.key = addKey(item);
                }

                if (item.method) {
                    converted.click = function (value) {
                        item.method(value);
                    };
                }

                return converted;
            }

            // Get initial value for a given property
            function initializeState(property) {
                var result;
                structure.forEach(function (item) {
                    if (item.property === property) {
                        result = _.get(item.domainObject, item.property);
                    }
                });

                return result;
            }

            // Tracks the domain object and property for every element in the state array
            this.stateTracker = [];
            this.toolbarStructure = structure.map(convertItem);
            this.toolbarState = this.properties.map(initializeState);
        };

        /**
         * Gets the structure of the toolbar, as appropriate to
         * pass to `mct-toolbar`.
         *
         * @returns {Array} the toolbar structure
         */
        EditToolbar.prototype.getStructure = function () {
            return this.toolbarStructure;
        };

        /**
         * Gets the current state of the toolbar, as appropriate
         * to two-way bind to the state handled by `mct-toolbar`.
         *
         * @returns {Array} state of the toolbar
         */
        EditToolbar.prototype.getState = function () {
            return this.toolbarState;
        };

        /**
         * Mutates the domain object's property with a new value.
         *
         * @param {Object} dominObject the domain object
         * @param {string} property the domain object's property to update
         * @param value the property's new value
         */
        EditToolbar.prototype.updateDomainObject = function (domainObject, property, value) {
            this.openmct.objects.mutate(domainObject, property, value);
        };

        /**
         * Updates state with the new value.
         *
         * @param {number} index the index of the corresponding
         *        element in the state array
         * @param value the new value to update the state array with
         */
        EditToolbar.prototype.updateState = function (index, value) {
            this.toolbarState[index] = value;
        };

        /**
         * Register listeners for domain objects to watch for updates.
         *
         * @param {Array} the toolbar structure
         */
        EditToolbar.prototype.registerListeners = function (structure) {
            var self = this;

            function observeObject(domainObject, id) {
                var unobserveObject = self.openmct.objects.observe(domainObject, '*', function (newObject) {
                    self.domainObjectsById[id].newObject = JSON.parse(JSON.stringify(newObject));
                    self.scheduleStateUpdate();
                });
                self.unobserveObjects.push(unobserveObject);
            }

            structure.forEach(function (item) {
                var domainObject = item.domainObject;
                var id = objectUtils.makeKeyString(domainObject.identifier);

                if (!self.domainObjectsById[id]) {
                    self.domainObjectsById[id] = {
                        domainObject: domainObject,
                        properties: []
                    };
                    observeObject(domainObject, id);
                }

                self.domainObjectsById[id].properties.push(item.property);
            });
        };

        /**
         * Delays updating the state.
         */
        EditToolbar.prototype.scheduleStateUpdate = function () {
            if (this.stateUpdateScheduled) {
                return;
            }

            this.stateUpdateScheduled = true;
            setTimeout(this.updateStateAfterMutation.bind(this));
        };

        EditToolbar.prototype.updateStateAfterMutation = function () {
            this.stateTracker.forEach(function (state, index) {
                if (!this.domainObjectsById[state.id].newObject) {
                    return;
                }

                var domainObject = this.domainObjectsById[state.id].domainObject;
                var newObject = this.domainObjectsById[state.id].newObject;
                var currentValue = _.get(domainObject, state.property);
                var newValue = _.get(newObject, state.property);

                state.domainObject = newObject;

                if (currentValue !== newValue) {
                    this.updateState(index, newValue);
                }
            }, this);

            Object.values(this.domainObjectsById).forEach(function (tracker) {
                if (tracker.newObject) {
                    tracker.domainObject = tracker.newObject;
                }
                delete tracker.newObject;
            });
            this.stateUpdateScheduled = false;
        };

        /**
         * Removes the listeners.
         */
        EditToolbar.prototype.deregisterListeners = function () {
            this.unobserveObjects.forEach(function (unobserveObject) {
                unobserveObject();
            });
            this.unobserveObjects = [];
        };

        EditToolbar.prototype.handleStateChanges = function (state) {
            (state || []).map(function (newValue, index) {
                var domainObject = this.stateTracker[index].domainObject;
                var property = this.stateTracker[index].property;
                var currentValue = _.get(domainObject, property);

                if (currentValue !== newValue) {
                    this.updateDomainObject(domainObject, property, newValue);
                }
            }, this);
        };

        EditToolbar.prototype.destroy = function () {
            this.deregisterListeners();
        };

        return EditToolbar;
    }
);
