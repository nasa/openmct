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
    ['../../TimelineConstants'],
    function (Constants) {
        "use strict";

        /**
         * Handle for changing the start time of a timeline or
         * activity in the Timeline view.
         * @constructor
         * @param {string} id identifier of the domain object
         * @param {TimelineDragHandler} dragHandler the handler which
         *        will update object state
         * @param {TimelineSnapHandler} snapHandler the handler which
         *        provides candidate snap-to locations.
         */
        function TimelineStartHandle(id, dragHandler, snapHandler) {
            var initialStart;

            // Get the snap-to location for a timestamp
            function snap(timestamp, zoom) {
                return snapHandler.snap(
                    timestamp,
                    zoom.toMillis(Constants.SNAP_WIDTH),
                    id
                );
            }

            return {
                /**
                 * Start dragging this handle.
                 */
                begin: function () {
                    // Cache the initial state
                    initialStart = dragHandler.start(id);
                },
                /**
                 * Drag this handle.
                 * @param {number} delta pixel delta from start
                 * @param {TimelineZoomController} zoom provider of zoom state
                 */
                drag: function (delta, zoom) {
                    if (initialStart !== undefined) {
                        // Update the state
                        dragHandler.start(
                            id,
                            snap(initialStart + zoom.toMillis(delta), zoom)
                        );
                    }
                },
                /**
                 * Finish dragging this handle.
                 */
                finish: function () {
                    // Clear initial state
                    initialStart = undefined;
                    // Persist changes
                    dragHandler.persist();
                },
                /**
                 * Get a style object (suitable for passing into `ng-style`)
                 * for this handle.
                 * @param {TimelineZoomController} zoom provider of zoom state
                 */
                style: function (zoom) {
                    return {
                        left: zoom.toPixels(dragHandler.start(id)) + 'px',
                        width: Constants.HANDLE_WIDTH + 'px'
                    };
                }
            };
        }

        return TimelineStartHandle;
    }
);