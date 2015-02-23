/*global define*/
define(
    [],
    function () {
        "use strict";

        // Utility functions for reducing truth arrays
        function and(a, b) { return a && b; }
        function or(a, b) { return a || b; }


        /**
         * Provides initial structure and state (as suitable for provision
         * to the `mct-toolbar` directive) for a view's tool bar, based on
         * that view's declaration of what belongs in its tool bar and on
         * the current selection.
         *
         * @param structure toolbar structure, as provided by view definition
         * @param {Array} selection the current selection state
         * @param {Function} commit callback to invoke after changes
         * @constructor
         */
        function EditToolbar(structure, commit) {
            var toolbarStructure = Object.create(structure || {}),
                toolbarState,
                selection,
                properties = [];

            // Generate a new key for an item's property
            function addKey(property) {
                properties.push(property);
                return properties.length - 1; // Return index of property
            }

            // Update value for this property in all elements of the
            // selection which have this property.
            function updateProperties(property, value) {
                // Update property in a selected element
                function updateProperty(selected) {
                    // Ignore selected elements which don't have this property
                    if (selected[property] !== undefined) {
                        // Check if this is a setter, or just assignable
                        if (typeof selected[property] === 'function') {
                            selected[property](value);
                        } else {
                            selected[property] = value;
                        }
                    }
                }

                // Update property in all selected elements
                selection.forEach(updateProperty);
            }

            // Look up the current value associated with a property
            // in selection i
            function lookupState(property, selected) {
                var value = selected[property];
                return (typeof value === 'function') ? value() : value;
            }

            // Get initial value for a given property
            function initializeState(property) {
                var result;
                // Look through all selections for this property;
                // values should all match by the time we perform
                // this lookup anyway.
                selection.forEach(function (selected) {
                    result = (selected[property] !== undefined) ?
                            lookupState(property, selected) :
                            result;
                });
                return result;
            }

            // Check if all elements of the selection which have this
            // property have the same value for this property.
            function isConsistent(property) {
                var consistent = true,
                    observed = false,
                    state;

                // Check if a given element of the selection is consistent
                // with previously-observed elements for this property.
                function checkConsistency(selected) {
                    var next;
                    // Ignore selections which don't have this property
                    if (selected[property] !== undefined) {
                        // Look up state of this element in the selection
                        next = lookupState(property, selected);
                        // Detect inconsistency
                        if (observed) {
                            consistent = consistent && (next === state);
                        }
                        // Track state for next iteration
                        state = next;
                        observed = true;
                    }
                }

                // Iterate through selections
                selection.forEach(checkConsistency);

                return consistent;
            }

            // Used to filter out items which are applicable (or not)
            // to the current selection.
            function isApplicable(item) {
                var property = (item || {}).property,
                    method = (item || {}).method,
                    exclusive = (item || {}).exclusive;

                // Check if a selected item defines this property
                function hasProperty(selected) {
                    return (property && (selected[property] !== undefined)) ||
                            (method && (typeof selected[method] === 'function'));
                }

                return selection.map(hasProperty).reduce(
                    exclusive ? and : or,
                    exclusive
                ) && isConsistent(property);
            }

            // Invoke all functions in selections with the given name
            function invoke(method, value) {
                if (method) {
                    // Make the change in the selection
                    selection.forEach(function (selected) {
                        if (typeof selected[method] === 'function') {
                            selected[method](value);
                        }
                    });
                    // ...and commit!
                    commit();
                }
            }

            // Prepare a toolbar item based on current selection
            function convertItem(item) {
                var converted = Object.create(item || {});
                if (item.property) {
                    converted.key = addKey(item.property);
                }
                if (item.method) {
                    converted.click = function (v) {
                        invoke(item.method, v);
                    };
                }
                return converted;
            }

            // Used to filter out sections that have become empty
            function nonEmpty(section) {
                return section && section.items && section.items.length > 0;
            }

            // Prepare a toolbar section
            function convertSection(section) {
                var converted = Object.create(section || {});
                converted.items =
                    ((section || {}).items || [])
                            .map(convertItem);
                return converted;
            }

            // Show/hide controls in this section per applicability
            function refreshSectionApplicability(section) {
                var count = 0;
                // Show/hide each item
                (section.items || []).forEach(function (item) {
                    item.hidden = !isApplicable(item);
                    count += item.hidden ? 0 : 1;
                });
                // Hide this section if there are no applicable items
                section.hidden = !count;
            }

            // Show/hide controls if they are applicable
            function refreshApplicability() {
                toolbarStructure.sections.forEach(refreshSectionApplicability);
            }

            // Refresh toolbar state to match selection
            function refreshState() {
                toolbarState = properties.map(initializeState);
            }

            toolbarStructure.sections =
                ((structure || {}).sections || [])
                        .map(convertSection)
                        .filter(nonEmpty);

            toolbarState = [];

            return {
                /**
                 * Set the current selection. Visisbility of sections
                 * and items in the toolbar will be updated to match this.
                 * @param {Array} s the new selection
                 */
                setSelection: function (s) {
                    selection = s;
                    refreshApplicability();
                    refreshState();
                },
                /**
                 * Get the structure of the toolbar, as appropriate to
                 * pass to `mct-toolbar`.
                 * @returns the toolbar structure
                 */
                getStructure: function () {
                    return toolbarStructure;
                },
                /**
                 * Get the current state of the toolbar, as appropriate
                 * to two-way bind to the state handled by `mct-toolbar`.
                 * @returns {Array} state of the toolbar
                 */
                getState: function () {
                    return toolbarState;
                },
                /**
                 * Update state within the current selection.
                 * @param {number} index the index of the corresponding
                 *        element in the state array
                 * @param value the new value to convey to the selection
                 */
                updateState: function (index, value) {
                    updateProperties(properties[index], value);
                }
            };
        }

        return EditToolbar;
    }
);

