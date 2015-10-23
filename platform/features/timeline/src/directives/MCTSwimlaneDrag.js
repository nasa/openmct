/*global define*/

define(
    ['./SwimlaneDragConstants'],
    function (SwimlaneDragConstants) {
        "use strict";

        /**
         * Defines the `mct-swimlane-drag` directive. When a drag is initiated
         * form an element with this attribute, the swimlane being dragged
         * (identified by the value of this attribute, as an Angular expression)
         * will be exported to the `dndService` as part of the active drag-drop
         * state.
         * @param {DndService} dndService drag-and-drop service
         */
        function MCTSwimlaneDrag(dndService) {
            function link(scope, element, attrs) {
                // Look up the swimlane from the provided expression
                function swimlane() {
                    return scope.$eval(attrs.mctSwimlaneDrag);
                }
                // When drag starts, publish via dndService
                element.on('dragstart', function () {
                    dndService.setData(
                        SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE,
                        swimlane()
                    );
                });
                // When drag ends, clear via dndService
                element.on('dragend', function () {
                    dndService.removeData(
                        SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE
                    );
                });
            }

            return {
                // Applies to attributes
                restrict: "A",
                // Link using above function
                link: link
            };
        }

        return MCTSwimlaneDrag;
    }
);
