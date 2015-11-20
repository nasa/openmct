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
