/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Selection proxy for the Timeline view. Implements
         * behavior associated with the Add button in the
         * timeline's toolbar.
         * @constructor
         */
        function TimelineProxy(domainObject, selection) {
            var actionMap = {};

            // Populate available Create actions for this domain object
            function populateActionMap(domainObject) {
                var actionCapability = domainObject.getCapability('action'),
                    actions = actionCapability ?
                            actionCapability.getActions('create') : [];
                actions.forEach(function (action) {
                    actionMap[action.getMetadata().type] = action;
                });
            }

            // Populate available actions based on current selection
            // (defaulting to object-in-view if there is none.)
            function populateForSelection() {
                var swimlane = selection && selection.get(),
                    selectedObject = swimlane && swimlane.domainObject;
                populateActionMap(selectedObject || domainObject);
            }

            populateActionMap(domainObject);

            return {
                /**
                 * Add a domain object of the specified type.
                 * @param {string} type the type of domain object to add
                 */
                add: function (type) {
                    // Update list of create actions; this needs to reflect
                    // the current selection so that Save in defaults
                    // appropriately.
                    populateForSelection();

                    // Create an object of that type
                    if (actionMap[type]) {
                        return actionMap[type].perform();
                    }
                }
            };
        }

        return TimelineProxy;
    }
);