/*global define*/

define(
    ['./SwimlaneDragConstants'],
    function (SwimlaneDragConstants) {
        "use strict";

        /**
         * Defines the `warp-swimlane-drop` directive. When a drop occurs
         * on an element with this attribute, the swimlane targeted by the drop
         * (identified by the value of this attribute, as an Angular expression)
         * will receive the dropped domain object (at which point it can handle
         * the drop, typically by inserting/reordering.)
         * @param {DndService} dndService drag-and-drop service
         */
        function WARPSwimlaneDrop(dndService) {

            // Handle dragover events
            function dragOver(e, element, swimlane) {
                var event = (e || {}).originalEvent || e,
                    height = element[0].offsetHeight,
                    rect = element[0].getBoundingClientRect(),
                    offset = event.pageY - rect.top,
                    dataTransfer = event.dataTransfer,
                    id = dndService.getData(
                        SwimlaneDragConstants.MCT_DRAG_TYPE
                    ),
                    draggedObject = dndService.getData(
                        SwimlaneDragConstants.MCT_EXTENDED_DRAG_TYPE
                    );

                if (id) {
                    // TODO: Vary this based on modifier keys
                    event.dataTransfer.dropEffect = 'move';

                    // Set the swimlane's drop highlight state; top 75% is
                    // for drop-into, bottom 25% is for drop-after.
                    swimlane.highlight(
                        offset < (height * 0.75) &&
                                swimlane.allowDropIn(id, draggedObject)
                    );
                    swimlane.highlightBottom(
                        offset >= (height * 0.75) &&
                                swimlane.allowDropAfter(id, draggedObject)
                    );

                    // Indicate that we will accept the drag
                    if (swimlane.highlight() || swimlane.highlightBottom()) {
                        event.preventDefault(); // Required in Chrome?
                        return false;
                    }
                }
            }

            // Handle drop events
            function drop(e, element, swimlane) {
                var event = (e || {}).originalEvent || e,
                    dataTransfer = event.dataTransfer,
                    id = dataTransfer.getData(
                        SwimlaneDragConstants.MCT_DRAG_TYPE
                    ),
                    draggedSwimlane = dndService.getData(
                        SwimlaneDragConstants.WARP_SWIMLANE_DRAG_TYPE
                    );

                if (id) {
                    // Delegate the drop to the swimlane itself
                    swimlane.drop(id, (draggedSwimlane || {}).domainObject);
                }

                // Clear the swimlane highlights
                swimlane.highlight(false);
                swimlane.highlightBottom(false);
            }

            function link(scope, element, attrs) {
                // Lookup swimlane by evaluating this attribute
                function swimlane() {
                    return scope.$eval(attrs.warpSwimlaneDrop);
                }
                // Handle dragover
                element.on('dragover', function (e) {
                    dragOver(e, element, swimlane());
                });
                // Handle drops
                element.on('drop', function (e) {
                    drop(e, element, swimlane());
                });
                // Clear highlights when drag leaves this swimlane
                element.on('dragleave', function () {
                    swimlane().highlight(false);
                    swimlane().highlightBottom(false);
                });
            }

            return {
                // Applies to attributes
                restrict: "A",
                // Link using above function
                link: link
            };
        }

        return WARPSwimlaneDrop;
    }
);