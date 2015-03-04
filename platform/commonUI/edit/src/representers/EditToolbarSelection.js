/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Tracks selection state for Layout and Fixed Position views.
         * This manages and mutates the provided selection array in-place,
         * and takes care to only modify the array elements it manages
         * (the view's proxy, and the single selection); selections may be
         * added or removed elsewhere provided that similar care is taken
         * elsewhere.
         *
         * @param {Array} selection the selection array from the view's scope
         * @param [proxy] an object which represents the selection of the view
         *        itself (which handles view-level toolbar behavior)
         */
        function EditToolbarSelection() {
            var selection = [ {} ],
                selecting = false,
                selected;

            // Remove the currently-selected object
            function deselect() {
                // Nothing to do if we don't have a selected object
                if (selecting) {
                    // Clear state tracking
                    selecting = false;
                    selected = undefined;

                    // Remove the selection
                    selection.pop();

                    return true;
                }
                return false;
            }

            // Select an object
            function select(obj) {
                // Proxy is always selected
                if (obj === selection[0]) {
                    return false;
                }

                // Clear any existing selection
                deselect();

                // Note the current selection state
                selected = obj;
                selecting = true;

                // Add the selection
                selection.push(obj);
            }


            // Check if an object is selected
            function isSelected(obj) {
                return (obj === selected) || (obj === selection[0]);
            }

            // Getter for current selection
            function get() {
                return selected;
            }

            // Getter/setter for view proxy
            function proxy(p) {
                if (arguments.length > 0) {
                    selection[0] = p;
                }
                return selection[0];
            }

            // Getter for the full array of selected objects (incl. view proxy)
            function all() {
                return selection;
            }

            return {
                /**
                 * Check if an object is currently selected.
                 * @returns true if selected, otherwise false
                 */
                selected: isSelected,
                /**
                 * Select an object.
                 * @param obj the object to select
                 * @returns {boolean} true if selection changed
                 */
                select: select,
                /**
                 * Clear the current selection.
                 * @returns {boolean} true if selection changed
                 */
                deselect: deselect,
                /**
                 * Get the currently-selected object.
                 * @returns the currently selected object
                 */
                get: get,
                /**
                 * Get/set the view proxy (for toolbar actions taken upon
                 * the view itself.)
                 * @param [proxy] the view proxy (if setting)
                 * @returns the current view proxy
                 */
                proxy: proxy,
                /**
                 * Get an array containing all selections, including the
                 * selection proxy. It is generally not advisable to
                 * mutate this array directly.
                 * @returns {Array} all selections
                 */
                all: all
            };
        }

        return EditToolbarSelection;
    }
);