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
    ['./EditToolbar', './EditToolbarSelection'],
    function (EditToolbar, EditToolbarSelection) {

        // No operation
        var NOOP_REPRESENTER = {
            represent: function () {},
            destroy: function () {}
        };

        /**
         * The EditToolbarRepresenter populates the toolbar in Edit mode
         * based on a view's definition.
         * @param {Scope} scope the Angular scope of the representation
         * @memberof platform/commonUI/edit
         * @constructor
         * @implements {Representer}
         */
        function EditToolbarRepresenter(openmct, scope, element, attrs) {
            var self = this;

            // Mark changes as ready to persist
            function commit(message) {
                if (scope.commit) {
                    scope.commit(message);
                }
            }

            // Update the toolbar's structure.
            function updateStructure(structure, selectedControl) {
                // Only update if there is a toolbar to update
                if (self.toolbar) {
                    self.toolbar.updateToolbar(structure, selectedControl);
                    self.toolbarObject.structure = self.toolbar.getStructure();
                    self.toolbarObject.state = self.toolbar.getState();
                    self.exposeToolbar();
                }
            }

            // Get state (to watch it)
            function getState() {
                return self.toolbarObject.state;
            }

            // Update selection models to match changed toolbar state
            function updateState(state) {
                // Update underlying state based on toolbar changes
                var changed = (state || []).map(function (value, index) {
                    return self.toolbar.updateState(index, value);
                }).reduce(function (a, b) {
                    return a || b;
                }, false);

                // Only commit if something actually changed
                if (changed) {
                    // Commit the changes.
                    commit("Changes from toolbar.");
                }
            }

            // Avoid attaching scope to this;
            // http://errors.angularjs.org/1.2.26/ng/cpws
            this.setSelection = function (s) {
                scope.selection = s;
            };
            this.clearExposedToolbar = function () {
                // Clear exposed toolbar state (if any)
                if (attrs.toolbar) {
                    delete scope.$parent[attrs.toolbar];
                }
            };
            this.exposeToolbar = function () {
                scope.$parent[self.attrs.toolbar] = self.toolbarObject;
            };

            this.commit = commit;
            this.attrs = attrs;
            this.updateStructure = updateStructure;
            this.toolbar = undefined;
            this.toolbarObject = {};
            this.openmct = openmct;

            // If this representation exposes a toolbar, set up watches
            // and listen for selection change event.
            if (attrs && attrs.toolbar) {
                // Detect and handle changes to state from the toolbar
                scope.$watchCollection(getState, updateState);
                // Expose toolbar state under that name
                scope.$parent[attrs.toolbar] = this.toolbarObject;

                openmct.selection.on('change', function (selection) {
                    var structure = self.openmct.toolbars.get(selection) || [];
                    var selected = selection[0];
                    var selectedControl = selected && selected.context.toolbar;

                    this.updateStructure(structure, selectedControl ? [selectedControl] : []);
                }.bind(this));
            } else {
                // No toolbar declared, so do nothing.
                return NOOP_REPRESENTER;
            }
        }

        // Represent a domain object using this definition
        EditToolbarRepresenter.prototype.represent = function (representation) {
            if (this.attrs.toolbar) {
                // Initialize toolbar object
                this.toolbar = new EditToolbar(this.commit);
            }
            
            // Create a selection scope
            this.setSelection(new EditToolbarSelection(this.openmct));
        };

        // Destroy; remove toolbar object from parent scope
        EditToolbarRepresenter.prototype.destroy = function () {
            this.clearExposedToolbar();
        };

        return EditToolbarRepresenter;
    }
);
