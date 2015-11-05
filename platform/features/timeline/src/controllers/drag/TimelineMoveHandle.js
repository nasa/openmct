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
         * Handle for moving (by drag) a timeline or
         * activity in the Timeline view.
         * @constructor
         * @param {string} id identifier of the domain object
         * @param {TimelineDragHandler} dragHandler the handler which
         *        will update object state
         * @param {TimelineSnapHandler} snapHandler the handler which
         *        provides candidate snap-to locations.
         */
        function TimelineMoveHandle(id, dragHandler, snapHandler) {
            var initialStart,
                initialEnd;

            // Get the snap-to location for a timestamp
            function snap(timestamp, zoom) {
                return snapHandler.snap(
                    timestamp,
                    zoom.toMillis(Constants.SNAP_WIDTH),
                    id
                );
            }

            // Convert a pixel delta to a millisecond delta that will align
            // with some useful snap location
            function snapDelta(delta, zoom) {
                var timeDelta = zoom.toMillis(delta),
                    desiredStart = initialStart + timeDelta,
                    desiredEnd = initialEnd + timeDelta,
                    snappedStart = snap(desiredStart, zoom),
                    snappedEnd = snap(desiredEnd, zoom),
                    diffStart = Math.abs(snappedStart - desiredStart),
                    diffEnd = Math.abs(snappedEnd - desiredEnd),
                    chooseEnd = false;

                // First, check for case where both changed...
                if ((diffStart > 0) && (diffEnd > 0)) {
                    // ...and choose the smallest change that snaps.
                    chooseEnd = diffEnd < diffStart;
                } else {
                    // ...otherwise, snap toward the end if it changed.
                    chooseEnd = diffEnd > 0;
                }
                // Start is chosen if diffEnd didn't snap, or nothing snapped

                // Our delta is relative to our initial state, but
                // dragHandler.move is relative to current state, so whichever
                // end we're snapping to, we need to compute a delta
                // relative to the current state to get the desired result.
                return chooseEnd ?
                        (snappedEnd - dragHandler.end(id)) :
                        (snappedStart - dragHandler.start(id));
            }

            return {
                /**
                 * Start dragging this handle.
                 */
                begin: function () {
                    // Cache the initial state
                    initialStart = dragHandler.start(id);
                    initialEnd = dragHandler.end(id);
                },
                /**
                 * Drag this handle.
                 * @param {number} delta pixel delta from start
                 * @param {TimelineZoomController} zoom provider of zoom state
                 */
                drag: function (delta, zoom) {
                    if (initialStart !== undefined && initialEnd !== undefined) {
                        if (delta !== 0) {
                            dragHandler.move(id, snapDelta(delta, zoom));
                        }
                    }
                },
                /**
                 * Finish dragging this handle.
                 */
                finish: function () {
                    // Clear initial state
                    initialStart = undefined;
                    initialEnd = undefined;
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
                        left: zoom.toPixels(dragHandler.start(id)) +
                            Constants.HANDLE_WIDTH +
                            'px',
                        width: zoom.toPixels(dragHandler.duration(id)) -
                            Constants.HANDLE_WIDTH * 2
                            + 'px'
                        //cursor: initialStart === undefined ? 'grab' : 'grabbing'
                    };
                }
            };
        }

        return TimelineMoveHandle;
    }
);