/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ['./SwimlaneDragConstants'],
    function (SwimlaneDragConstants) {

        /**
         * Defines the `mct-resource-graph-drop` directive. When a drop occurs
         * on an element with this attribute, the swimlane targeted by the drop
         * will receive the dropped domain object (at which point it can handle
         * the drop, typically by toggling the swimlane graph.)
         * @param {DndService} dndService drag-and-drop service
         */
        function MCTResourceGraphDrop(dndService) {

            function link(scope, element, attrs) {
                // Handle dragover
                element.on('dragover', function (e) {
                    var swimlane = dndService.getData(
                        SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE
                    );

                    if (typeof swimlane !== "undefined" && !swimlane.graph()) {
                        element.addClass('drop-over');
                        scope.$apply();
                        e.preventDefault();
                    }
                });
                // Handle drops
                element.on('drop', function (e) {
                    var swimlane = dndService.getData(
                        SwimlaneDragConstants.TIMELINE_SWIMLANE_DRAG_TYPE
                    );

                    element.removeClass('drop-over');

                    // Only toggle if the graph isn't already set
                    if (typeof swimlane !== "undefined" && !swimlane.graph()) {
                        swimlane.toggleGraph();
                        e.preventDefault();
                    }
                });
                // Clear highlights when drag leaves this swimlane
                element.on('dragleave', function (e) {
                    element.removeClass('drop-over');
                    scope.$apply();
                    e.preventDefault();
                });
            }

            return {
                // Applies to attributes
                restrict: "A",
                // Link using above function
                link: link
            };
        }

        return MCTResourceGraphDrop;
    }
);
