/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    ['./SwimlaneDragConstants'],
    function (SwimlaneDragConstants) {
        "use strict";

        /**
         * Defines the `mct-swimlane-drop` directive. When a drop occurs
         * on an element with this attribute, the swimlane targeted by the drop
         * (identified by the value of this attribute, as an Angular expression)
         * will receive the dropped domain object (at which point it can handle
         * the drop, typically by inserting/reordering.)
         * @param {DndService} dndService drag-and-drop service
         */
        function MCTSwimlaneDrop(dndService) {

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
                        SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE
                    ),
                    droppedObject = draggedSwimlane ?
                        draggedSwimlane.domainObject :
                        dndService.getData(
                            SwimlaneDragConstants.MCT_EXTENDED_DRAG_TYPE
                        );

                if (id) {
                    event.stopPropagation();
                    e.preventDefault();
                    // Delegate the drop to the swimlane itself
                    swimlane.drop(id, droppedObject);
                }

                // Clear the swimlane highlights
                swimlane.highlight(false);
                swimlane.highlightBottom(false);
            }

            function link(scope, element, attrs) {
                // Lookup swimlane by evaluating this attribute
                function lookupSwimlane() {
                    return scope.$eval(attrs.mctSwimlaneDrop);
                }
                // Handle dragover
                element.on('dragover', function (e) {
                    var swimlane = lookupSwimlane(),
                        highlight = swimlane.highlight(),
                        highlightBottom = swimlane.highlightBottom();

                    dragOver(e, element, swimlane);

                    if (highlightBottom !== swimlane.highlightBottom() ||
                            highlight !== swimlane.highlight()) {
                        scope.$apply();
                    }
                });
                // Handle drops
                element.on('drop', function (e) {
                    drop(e, element, lookupSwimlane());
                    scope.$apply();
                });
                // Clear highlights when drag leaves this swimlane
                element.on('dragleave', function () {
                    var swimlane = lookupSwimlane(),
                        wasHighlighted = swimlane.highlight() ||
                                swimlane.highlightBottom();
                    swimlane.highlight(false);
                    swimlane.highlightBottom(false);
                    if (wasHighlighted) {
                        scope.$apply();
                    }
                });
            }

            return {
                // Applies to attributes
                restrict: "A",
                // Link using above function
                link: link
            };
        }

        return MCTSwimlaneDrop;
    }
);
