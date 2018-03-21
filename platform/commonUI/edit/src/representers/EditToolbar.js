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
         * to the `mct-toolbar` directive) for the tool bar.
         *
         * @param {Object} openmct the openmct object
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditToolbar($scope, openmct, structure) {
            var self = this;

            this.toolbarStructure = [];
            this.properties = [];
            this.toolbarState = [];
            this.openmct = openmct;
            this.domainObjectsById = {};
            this.unobserveObjects = [];
            this.stateTracker = [];

            $scope.$watchCollection(this.getState.bind(this), this.handleStateChanges.bind(this));

            $scope.$on("$destroy", function () {
                self.destroy();
            });

            this.updateToolbar(structure);
            this.registerListeners(structure);
        }

        /**
         * Updates the toolbar with a new structure.
         *
         * @param {Array} structure the toolbar structure
         * @returns {Array} an array that tracks domain object
         * and property for every element in the state array
         */
        EditToolbar.prototype.updateToolbar = function (structure) {
            var self = this;

            function addKey(item) {
                self.stateTracker.push({
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
         * Mutates the domain object to update the given property with a new value.
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
         * @param {number} index the index in the state array
         * @param value the new value to update the state array with
         */
        EditToolbar.prototype.updateState = function (index, value) {
            this.toolbarState[index] = value;
        };

        // Register listeners for domain objects to watch for updates.
        EditToolbar.prototype.registerListeners = function (structure) {
            var self = this;

            function observeObject(domainObject, id) {
                var unobserveObject = self.openmct.objects.observe(domainObject, '*', function (newObject) {

                    self.domainObjectsById[id].properties.map(function (property) {
                        var currentValue = _.get(domainObject, property);
                        var newValue = _.get(newObject, property);
                        var index = _.findIndex(self.stateTracker, {
                            'domainObject': domainObject,
                            'property': property
                        });

                        self.stateTracker[index].domainObject = newObject;

                        if (currentValue !== newValue) {
                            self.updateState(index, newValue);
                        }
                    });

                    domainObject = newObject;
                });

                self.unobserveObjects.push(unobserveObject);
            }

            structure.forEach(function (item) {
                var domainObject = item.domainObject;
                var id = objectUtils.makeKeyString(domainObject.identifier);

                if (!self.domainObjectsById[id]) {
                    self.domainObjectsById[id] = {};
                    observeObject(domainObject, id);
                }

                self.domainObjectsById[id].properties = self.domainObjectsById[id].properties || [];
                self.domainObjectsById[id].properties.push(item.property);
            });
        };

        EditToolbar.prototype.deregisterListeners = function () {
            this.unobserveObjects.forEach(function (unobserveObject) {
                unobserveObject();
            });

            this.unobserveObjects = [];
        };

        EditToolbar.prototype.handleStateChanges = function (state) {
            var self = this;

            (state || []).map(function (value, index) {
                var domainObject = self.stateTracker[index].domainObject;
                var property = self.stateTracker[index].property;
                var currentValue = _.get(domainObject, property);

                if (currentValue !== value) {
                    self.updateDomainObject(domainObject, property, value);
                }
            });
        };

        EditToolbar.prototype.destroy = function () {
            this.deregisterListeners();
        };

        return EditToolbar;
    }
);


