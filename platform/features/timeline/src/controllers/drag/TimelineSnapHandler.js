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
    [],
    function () {
        "use strict";

        /**
         * Snaps timestamps to match other timestamps within a
         * certain tolerance, to support the snap-to-start-and-end
         * behavior of drag interactions in a timeline view.
         * @constructor
         * @param {TimelineDragHandler} dragHandler the handler
         *        for drag interactions, which maintains start/end
         *        information for timelines in this view.
         */
        function TimelineSnapHandler(dragHandler) {
            // Snap to other end points
            function snap(timestamp, tolerance, exclude) {
                var result = timestamp,
                    closest = tolerance,
                    ids,
                    candidates;

                // Filter an id for inclustion
                function include(id) { return id !== exclude; }

                // Evaluate a candidate timestamp as a snap-to location
                function evaluate(candidate) {
                    var difference = Math.abs(candidate - timestamp);
                    // Is this closer than anything else we've found?
                    if (difference < closest) {
                        // ...then this is our new result
                        result = candidate;
                        // Track how close it was, for subsequent comparison.
                        closest = difference;
                    }
                }

                // Look up start time; for mapping below
                function getStart(id) {
                    return dragHandler.start(id);
                }

                // Look up end time; for mapping below
                function getEnd(id) {
                    return dragHandler.end(id);
                }

                // Get list of candidate ids
                ids = dragHandler.ids().filter(include);

                // Get candidate timestamps
                candidates = ids.map(getStart).concat(ids.map(getEnd));

                // ...and find the best one
                candidates.forEach(evaluate);

                // Closest candidate (or original timestamp) is our result
                // now, so return it.
                return result;
            }

            return {
                /**
                 * Get a timestamp location that is near this
                 * timestamp (or simply return the provided
                 * timestamp if none are near enough, according
                 * to the specified tolerance.)
                 * Start/end times associated with the domain object
                 * with the specified identifier will be excluded
                 * from consideration (to avoid an undesired snap-to-self
                 * behavior.)
                 * @param {number} timestamp the timestamp to snap
                 * @param {number} tolerance the difference within which
                 *        to snap
                 * @param {string} id the identifier to exclude
                 */
                snap: snap
            };
        }

        return TimelineSnapHandler;
    }
);