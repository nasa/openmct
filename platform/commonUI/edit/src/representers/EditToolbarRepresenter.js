/*global define*/

define(
    ['./EditToolbar'],
    function (EditToolbar) {
        "use strict";

        // No operation
        function noop() {}

        /**
         * The EditToolbarRepresenter populates the toolbar in Edit mode
         * based on a view's definition.
         * @param {Scope} scope the Angular scope of the representation
         * @constructor
         */
        function EditToolbarRepresenter(scope, element, attrs) {
            var definition,
                unwatch,
                toolbar,
                toolbarObject = {};

            // Mark changes as ready to persist
            function commit(message) {
                if (scope.commit) {
                    scope.commit(message);
                }
            }

            // Handle changes to the current selection
            function updateSelection(selection) {
                // Make sure selection is array-like
                selection = Array.isArray(selection) ?
                        selection :
                        (selection ? [selection] : []);

                // Instantiate a new toolbar...
                toolbar = new EditToolbar(definition, selection, commit);

                // ...and expose its structure/state
                toolbarObject.structure = toolbar.getStructure();
                toolbarObject.state = toolbar.getState();
            }

            // Get state (to watch it)
            function getState() {
                return toolbarObject.state;
            }

            // Update selection models to match changed toolbar state
            function updateState(state) {
                // Update underlying state based on toolbar changes
                state.forEach(function (value, index) {
                    toolbar.updateState(index, value);
                });
                // Commit the changes.
                commit("Changes from toolbar.");
            }

            // Initialize toolbar (expose object to parent scope)
            function initialize() {
                // If we have been asked to expose toolbar state...
                if (attrs.toolbar) {
                    // Expose toolbar state under that name
                    scope.$parent[attrs.toolbar] = toolbarObject;
                }
            }

            // Represent a domain object using this definition
            function represent(representation) {
                // Expose the toolbar object to the parent scope
                initialize();
                // Clear any existing selection
                scope.selection = [];
                // Get the newest toolbar definition from the view
                definition = (representation || {}).toolbar || {};
                // Initialize toolbar to an empty selection
                updateSelection([]);
            }

            // Destroy; remove toolbar object from parent scope
            function destroy() {
                // Clear exposed toolbar state (if any)
                if (attrs.toolbar) {
                    delete scope.$parent[attrs.toolbar];
                }
            }

            // If this representation exposes a toolbar, set up watches
            // to synchronize with it.
            if (attrs.toolbar) {
                // Detect and handle changes to state from the toolbar
                scope.$watchCollection(getState, updateState);
                // Watch for changes in the current selection state
                scope.$watchCollection("selection", updateSelection);
            }

            return {
                /**
                 * Set the current representation in use, and the domain
                 * object being represented.
                 *
                 * @param {RepresentationDefinition} representation the
                 *        definition of the representation in use
                 * @param {DomainObject} domainObject the domain object
                 *        being represented
                 */
                represent: (attrs || {}).toolbar ? represent : noop,
                /**
                 * Release any resources associated with this representer.
                 */
                destroy: (attrs || {}).toolbar ? destroy : noop
            };
        }

        return EditToolbarRepresenter;
    }
);