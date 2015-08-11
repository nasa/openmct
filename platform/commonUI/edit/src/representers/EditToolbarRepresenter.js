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
    ['./EditToolbar', './EditToolbarSelection'],
    function (EditToolbar, EditToolbarSelection) {
        "use strict";

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
        function EditToolbarRepresenter(scope, element, attrs) {
            var self = this;

            // Mark changes as ready to persist
            function commit(message) {
                if (scope.commit) {
                    scope.commit(message);
                }
            }

            // Handle changes to the current selection
            function updateSelection(selection) {
                // Only update if there is a toolbar to update
                if (self.toolbar) {
                    // Make sure selection is array-like
                    selection = Array.isArray(selection) ?
                            selection :
                            (selection ? [selection] : []);

                    // Update the toolbar's selection
                    self.toolbar.setSelection(selection);

                    // ...and expose its structure/state
                    self.toolbarObject.structure =
                        self.toolbar.getStructure();
                    self.toolbarObject.state =
                        self.toolbar.getState();
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
            this.updateSelection = updateSelection;
            this.toolbar = undefined;
            this.toolbarObject = {};

            // If this representation exposes a toolbar, set up watches
            // to synchronize with it.
            if (attrs && attrs.toolbar) {
                // Detect and handle changes to state from the toolbar
                scope.$watchCollection(getState, updateState);
                // Watch for changes in the current selection state
                scope.$watchCollection("selection.all()", updateSelection);
                // Expose toolbar state under that name
                scope.$parent[attrs.toolbar] = this.toolbarObject;
            } else {
                // No toolbar declared, so do nothing.
                return NOOP_REPRESENTER;
            }

        }

        // Represent a domain object using this definition
        EditToolbarRepresenter.prototype.represent = function (representation) {
            // Get the newest toolbar definition from the view
            var definition = (representation || {}).toolbar || {},
                self = this;

            // Initialize toolbar (expose object to parent scope)
            function initialize(definition) {
                // If we have been asked to expose toolbar state...
                if (self.attrs.toolbar) {
                    // Initialize toolbar object
                    self.toolbar = new EditToolbar(definition, self.commit);
                    // Ensure toolbar state is exposed
                    self.exposeToolbar();
                }
            }

            // Expose the toolbar object to the parent scope
            initialize(definition);
            // Create a selection scope
            this.setSelection(new EditToolbarSelection());
            // Initialize toolbar to an empty selection
            this.updateSelection([]);
        };

        // Destroy; remove toolbar object from parent scope
        EditToolbarRepresenter.prototype.destroy = function () {
            this.clearExposedToolbar();
        };

        return EditToolbarRepresenter;
    }
);
