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
        'use strict';

        /**
         * Describes the time span of a timeline object.
         * @param model the timeline's object model
         * @param {Timespan[]} time spans of contained activities
         */
        function TimelineTimespan(model, mutation, timespans) {
            // Get the start time for this timeline
            function getStart() {
                return model.start.timestamp;
            }

            // Get the end time for another time span
            function getTimespanEnd(timespan) {
                return timespan.getEnd();
            }

            // Wrapper for Math.max; used for max-finding of end time
            function max(a, b) {
                return Math.max(a, b);
            }

            // Get the end time for this timeline
            function getEnd() {
                return timespans.map(getTimespanEnd).reduce(max, getStart());
            }

            // Get the duration of this timeline
            function getDuration() {
                return getEnd() - getStart();
            }

            // Set the start time associated with this object
            function setStart(value) {
                mutation.mutate(function (model) {
                    model.start.timestamp = Math.max(value, 0);
                }, model.modified);
            }

            // Set the duration associated with this object
            function setDuration(value) {
                // No-op; duration is implicit
            }

            // Set the end time associated with this object
            function setEnd(value) {
                // No-op; end time is implicit
            }

            // Get the epoch used by this timeline
            function getEpoch() {
                return model.start.epoch;
            }

            return {
                /**
                 * Get the start time, in milliseconds relative to the epoch.
                 * @returns {number} the start time
                 */
                getStart: getStart,
                /**
                 * Get the duration, in milliseconds.
                 * @returns {number} the duration
                 */
                getDuration: getDuration,
                /**
                 * Get the end time, in milliseconds relative to the epoch.
                 * @returns {number} the end time
                 */
                getEnd: getEnd,
                /**
                 * Set the start time, in milliseconds relative to the epoch.
                 * @param {number} the new value
                 */
                setStart: setStart,
                /**
                 * Set the duration, in milliseconds. Timeline durations are
                 * implicit, so this is actually a no-op
                 * @param {number} the new value
                 */
                setDuration: setDuration,
                /**
                 * Set the end time, in milliseconds. Timeline end times are
                 * implicit, so this is actually a no-op.
                 * @param {number} the new value
                 */
                setEnd: setEnd,
                /**
                 * Get a string identifying the reference epoch used for
                 * start and end times.
                 * @returns {string} the epoch
                 */
                getEpoch: getEpoch
            };
        }

        return TimelineTimespan;
    }
);