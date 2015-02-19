/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Tracks selection state for Layout and Fixed Position views.
         * @param {Array} selection the selection array from the view's scope
         * @param [proxy] an object which represents the selection of the view
         *        itself (which handles view-level toolbar behavior)
         */
        function LayoutSelection(selection, proxy) {
            var selecting = false,
                selected;

            // Find the proxy in the array; our selected objects will be
            // positioned next to that
            function proxyIndex() {
                return selection.indexOf(proxy);
            }

            // Remove the currently-selected object
            function deselect() {
                // Nothing to do if we don't have a selected object
                if (selecting) {
                    // Clear state tracking
                    selecting = false;
                    selected = undefined;

                    // Remove the selection
                    selection.splice(proxyIndex() + 1, 1);

                    return true;
                }
                return false;
            }

            // Select an object
            function select(obj) {
                // We want this selection to end up near the proxy
                var index = proxyIndex() + 1;

                // Proxy is always selected
                if (obj === proxy) {
                    return false;
                }

                // Clear any existing selection
                deselect();

                // Note the current selection state
                selected = obj;
                selecting = true;

                // Are we at the end of the array?
                if (selection.length === index) {
                    // Add it to the end
                    selection.push(obj);
                } else {
                    // Splice it into the array
                    selection.splice(index, 0, obj);
                }
            }

            // Remove any selected object, and the proxy itself
            function destroy() {
                deselect();
                selection.splice(proxyIndex(), 1);
            }

            // Check if an object is selected
            function isSelected(obj) {
                return (obj === selected) || (obj === proxy);
            }

            // Getter for current selection
            function get() {
                return selected;
            }

            // Start with the proxy selected
            selection.push(proxy);

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
                 * Clear the selection, including the proxy, and dispose
                 * of this selection scope. No other calls to methods on
                 * this object are expected after `destroy` has been
                 * called; their behavior will be undefined.
                 */
                destroy: destroy
            };
        }

        return LayoutSelection;
    }
);