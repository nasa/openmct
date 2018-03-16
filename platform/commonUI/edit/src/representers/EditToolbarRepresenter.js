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
        './EditToolbar',
        '../../../../../src/api/objects/object-utils',
        'lodash'
    ],
    function (
        EditToolbar,
        objectUtils,
        _
    ) {

        // No operation
        var NOOP_REPRESENTER = {
            represent: function () {},
            destroy: function () {}
        };

        /**
         * The EditToolbarRepresenter populates the toolbar in Edit mode
         * based on toolbars definitions.
         * @param {Scope} scope the Angular scope of the representation
         * @memberof platform/commonUI/edit
         * @constructor
         * @implements {Representer}
         */
        function EditToolbarRepresenter(openmct, scope, element, attrs) {
            var self = this;

            // Update toolbar with a new structure and state.
            function createStructure(structure) {
                if (self.editToolbar) {
                    self.stateTracker = self.editToolbar.updateToolbar(structure);
                    self.toolbar.structure = self.editToolbar.getStructure();
                    self.toolbar.state = self.editToolbar.getState();
                    self.exposeToolbar();
                }
            }

            // Get state (to watch it)
            function getState() {
                return self.toolbar.state;
            }

            // Update the domain object to match changed toolbar state
            function handleStateChanges(state) {
                (state || []).map(function (value, index) {
                    var domainObject = self.stateTracker[index].domainObject;
                    var property = self.stateTracker[index].property;
                    var currentValue = _.get(domainObject, property);

                    if (currentValue !== value) {
                        self.editToolbar.updateDomainObject(domainObject, property, value);
                    }
                });
            }

            function handleSelection(selection) {
                if (selection[0].context.oldItem === self.selectedItem) {
                    return;
                }
                self.selectedItem = selection[0].context.oldItem;

                self.domainObjectsById = {};
                self.stateTracker = [];
                self.deregisterListeners();

                var structure = self.openmct.toolbars.get(selection) || [];
                createStructure(structure);
                self.registerListeners(structure);
            }

            this.clearExposedToolbar = function () {
                if (attrs.toolbar) {
                    delete scope.$parent[attrs.toolbar];
                }
            };

            this.exposeToolbar = function () {
                scope.$parent[self.attrs.toolbar] = self.toolbar;
            };

            this.attrs = attrs;
            this.editToolbar = undefined;
            this.stateTracker = [];
            this.toolbar = {};
            this.openmct = openmct;
            this.unobserveObjects = [];
            this.domainObjectsById = {};

            // If this representation exposes a toolbar, set up a watch for state
            // and listen for selection change event.
            if (attrs && attrs.toolbar) {
                scope.$watchCollection(getState, handleStateChanges);

                openmct.selection.on('change', handleSelection);

                self.exposeToolbar();

                scope.$on("$destroy", function () {
                    self.openmct.selection.off("change", handleSelection);
                    self.deregisterListeners();
                });
            } else {
                // No toolbar declared, so do nothing.
                return NOOP_REPRESENTER;
            }
        }

        // Represent a domain object using this definition
        EditToolbarRepresenter.prototype.represent = function (representation) {
            if (this.attrs.toolbar) {
                this.editToolbar = new EditToolbar(this.openmct);
            }
        };

        // Destroy; remove toolbar object from parent scope
        EditToolbarRepresenter.prototype.destroy = function () {
            this.clearExposedToolbar();
        };

        // Register listeners for domain objects to watch for updates.
        EditToolbarRepresenter.prototype.registerListeners = function (structure) {
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
                            self.editToolbar.updateState(index, newValue);
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

        EditToolbarRepresenter.prototype.deregisterListeners = function () {
            this.unobserveObjects.forEach(function (unobserveObject) {
                unobserveObject();
            });

            this.unobserveObjects = [];
        };

        return EditToolbarRepresenter;
    }
);
