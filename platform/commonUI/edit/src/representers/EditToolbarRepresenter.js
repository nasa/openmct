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
    ['./EditToolbar', './EditToolbarSelection'],
    (EditToolbar, EditToolbarSelection) => {

        // No operation
        const NOOP_REPRESENTER = {
            represent: () => {},
            destroy: () => {}
        };

        /**
         * The EditToolbarRepresenter populates the toolbar in Edit mode
         * based on a view's definition.
         * @param {Scope} scope the Angular scope of the representation
         * @memberof platform/commonUI/edit
         * @constructor
         * @implements {Representer}
         */
        class EditToolbarRepresenter {
          constructor(scope, element, attrs) {

            // Mark changes as ready to persist
            const commit = (message) => {
                if (scope.commit) {
                    scope.commit(message);
                }
            }

            // Handle changes to the current selection
            const updateSelection = (selection) => {
                // Only update if there is a toolbar to update
                if (this.toolbar) {
                    // Make sure selection is array-like
                    selection = Array.isArray(selection) ?
                            selection :
                            (selection ? [selection] : []);

                    // Update the toolbar's selection
                    this.toolbar.setSelection(selection);

                    // ...and expose its structure/state
                    this.toolbarObject.structure =
                        this.toolbar.getStructure();
                    this.toolbarObject.state =
                        this.toolbar.getState();
                }
            }

            // Get state (to watch it)
            const getState = () => {
                return this.toolbarObject.state;
            }

            // Update selection models to match changed toolbar state
            const updateState = (state) => {
                // Update underlying state based on toolbar changes
                let changed = (state || []).map( (value, index) => {
                    return this.toolbar.updateState(index, value);
                }).reduce( (a, b) => {
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
            this.setSelection = (s) => {
                scope.selection = s;
            };
            this.clearExposedToolbar = () => {
                // Clear exposed toolbar state (if any)
                if (attrs.toolbar) {
                    delete scope.$parent[attrs.toolbar];
                }
            };
            this.exposeToolbar = () => {
                scope.$parent[this.attrs.toolbar] = this.toolbarObject;
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
        represent(representation) {
            // Get the newest toolbar definition from the view
            let definition = (representation || {}).toolbar || {}

            // Initialize toolbar (expose object to parent scope)
            const initialize = (def) => {
                // If we have been asked to expose toolbar state...
                if (this.attrs.toolbar) {
                    // Initialize toolbar object
                    this.toolbar = new EditToolbar(def, this.commit);
                    // Ensure toolbar state is exposed
                    this.exposeToolbar();
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
        destroy() {
            this.clearExposedToolbar();
        };
      }
        return EditToolbarRepresenter;
    }
);
