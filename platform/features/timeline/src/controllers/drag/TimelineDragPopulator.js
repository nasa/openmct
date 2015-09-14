/*global define*/

define(
    ['./TimelineDragHandler', './TimelineSnapHandler', './TimelineDragHandleFactory'],
    function (TimelineDragHandler, TimelineSnapHandler, TimelineDragHandleFactory) {
        "use strict";

        /**
         * Provides drag handles for the active selection in a timeline view.
         * @constructor
         */
        function TimelineDragPopulator(objectLoader) {
            var handles = [],
                factory,
                selectedObject;

            // Refresh active set of drag handles
            function refreshHandles() {
                handles = (factory && selectedObject) ?
                        factory.handles(selectedObject) :
                        [];
            }

            // Create a new factory for handles, based on root object in view
            function populateForObject(domainObject) {
                var dragHandler = domainObject && new TimelineDragHandler(
                        domainObject,
                        objectLoader
                    );

                // Reinstantiate the factory
                factory = dragHandler && new TimelineDragHandleFactory(
                    dragHandler,
                    new TimelineSnapHandler(dragHandler)
                );

                // If there's a selected object, restore the handles
                refreshHandles();
            }

            // Change the current selection
            function select(swimlane) {
                // Cache selection to restore handles if other changes occur
                selectedObject = swimlane && swimlane.domainObject;

                // Provide handles for this selection, if it's defined
                refreshHandles();
            }

            return {
                /**
                 * Get the currently-applicable set of drag handles.
                 * @returns {Array} drag handles
                 */
                get: function () {
                    return handles;
                },
                /**
                 * Set the root object in view. Drag interactions consider
                 * the full graph for snapping behavior, so this is needed.
                 * @param {DomainObject} domainObject the timeline object
                 *        being viewed
                 */
                populate: populateForObject,
                /**
                 * Update selection state. Passing undefined means there
                 * is no selection.
                 * @param {TimelineSwimlane} swimlane the selected swimlane
                 */
                select: select
            };
        }

        return TimelineDragPopulator;
    }
);