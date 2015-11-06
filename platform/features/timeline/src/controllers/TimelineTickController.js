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
    ["../TimelineFormatter"],
    function (TimelineFormatter) {
        "use strict";

        var FORMATTER = new TimelineFormatter();

        /**
         * Provides labels for the tick mark area of a timeline view.
         * Since the tick mark regin is potentially extremeley large,
         * only the subset of ticks which will actually be shown in
         * view are provided.
         * @constructor
         */
        function TimelineTickController() {
            var labels = [],
                lastFirst,
                lastStep,
                lastCount,
                lastStartMillis,
                lastEndMillis;

            // Actually recalculate the labels from scratch
            function calculateLabels(first, count, step, toMillis) {
                var result = [],
                    current;

                // Create enough labels to fill the visible area
                while (result.length < count) {
                    current = first + step * result.length;
                    result.push({
                        // Horizontal pixel position of this label
                        left: current,
                        // Text to display in this label
                        text: FORMATTER.format(toMillis(current))
                    });
                }

                return result;
            }

            // Get tick labels for this pixel span (recalculating if needed)
            function getLabels(start, width, step, toMillis) {
                // Calculate parameters for labels (first pixel position, last
                // pixel position.) These are checked to detect changes.
                var first = Math.floor(start / step) * step,
                    last = Math.ceil((start + width) / step) * step,
                    count = ((last - first) / step) + 1,
                    startMillis = toMillis(first),
                    endMillis = toMillis(last),
                    changed = (lastFirst !== first) ||
                            (lastCount !== count) ||
                            (lastStep !== step) ||
                            (lastStartMillis !== startMillis) ||
                            (lastEndMillis !== endMillis);

                // This will be used in a template, so only recalculate on
                // change.
                if (changed) {
                    labels = calculateLabels(first, count, step, toMillis);
                    // Cache to avoid recomputing later
                    lastFirst = first;
                    lastCount = count;
                    lastStep = step;
                    lastStartMillis = startMillis;
                    lastEndMillis = endMillis;
                }

                return labels;
            }


            return {
                /**
                 * Get labels for use in the visible region of a timeline's
                 * tick mark area. This will return the same array instance
                 * (without recalculating its contents) if called with the
                 * same parameters (and same apparent zoom state, as determined
                 * via `toMillis`), so it is safe to use in a template.
                 *
                 * @param {number} start left-most pixel position in view
                 * @param {number} width pixel width in view
                 * @param {number} step size, in pixels, of each major tick
                 * @param {Function} toMillis function to convert from pixel
                 *        positions to milliseconds
                 * @returns {Array} an array of tick mark labels, suitable
                 *          for use in the `timeline-ticks` template
                 */
                labels: getLabels
            };
        }

        return TimelineTickController;
    }
);