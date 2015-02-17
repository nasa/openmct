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

            // Handle changes to the current selection
            function updateSelection(selection) {
                // Make sure selection is array-like
                selection = Array.isArray(selection) ?
                        selection :
                        (selection ? [selection] : []);

                // Instantiate a new toolbar...
                toolbar = new EditToolbar(definition, selection);

                // ...and expose its structure/state
                toolbarObject.structure = toolbar.getStructure();
                toolbarObject.state = toolbar.getState();
            }

            // Update selection models to match changed toolbar state
            function updateState(state) {
                state.forEach(function (value, index) {
                    toolbar.updateState(index, value);
                });
            }

            // Represent a domain object using this definition
            function represent(representation) {
                // Clear any existing selection
                scope.selection = [];
                // Get the newest toolbar definition from the view
                definition = (representation || {}).toolbar || {};
                // Initialize toolbar to an empty selection
                updateSelection([]);
            }

            // Destroy; stop watching the parent for changes in
            // toolbar state.
            function destroy() {
                if (unwatch) {
                    unwatch();
                    unwatch = undefined;
                }
            }

            // If we have been asked to expose toolbar state...
            if (attrs.toolbar) {
                // Expose toolbar state under that name
                scope.$parent[attrs.toolbar] = toolbarObject;
                // Detect and handle changes to state from the toolbar
                unwatch = scope.$parent.$watchCollection(
                    attrs.toolbar + ".state",
                    updateState
                );
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