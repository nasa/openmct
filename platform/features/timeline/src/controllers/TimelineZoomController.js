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
define(
    [],
    function () {

        /**
         * Controls the pan-zoom state of a timeline view.
         * @constructor
         */
        function TimelineZoomController($scope, ZOOM_CONFIGURATION) {
            // Prefer to start with the middle index
            var zoomLevels = ZOOM_CONFIGURATION.levels || [1000],
                zoomIndex = Math.floor(zoomLevels.length / 2),
                tickWidth = ZOOM_CONFIGURATION.width || 200,
                bounds = { x: 0, width: tickWidth },
                duration = 86400000; // Default duration in view

            // Round a duration to a larger value, to ensure space for editing
            function roundDuration(value) {
                // Ensure there's always an extra day or so
                var sz = zoomLevels[zoomLevels.length - 1];
                value *= 1.25; // Add 25% padding to start
                return Math.ceil(value / sz) * sz;
            }

            function toMillis(pixels) {
                return (pixels / tickWidth) * zoomLevels[zoomIndex];
            }

            function toPixels(millis) {
                return tickWidth * millis / zoomLevels[zoomIndex];
            }

            // Get/set zoom level
            function setZoomLevel(level) {
                if (!isNaN(level)) {
                    // Modify zoom level, keeping it in range
                    zoomIndex = Math.min(
                        Math.max(level, 0),
                        zoomLevels.length - 1
                    );
                }
            }

            function initializeZoomFromTimespan(timespan) {
                var timelineDuration = timespan.getDuration();
                zoomIndex = 0;
                while (toMillis(bounds.width) < timelineDuration &&
                        zoomIndex < zoomLevels.length - 1) {
                    zoomIndex += 1;
                }
                bounds.x = toPixels(timespan.getStart());
            }

            function initializeZoom() {
                if ($scope.domainObject) {
                    $scope.domainObject.useCapability('timespan')
                        .then(initializeZoomFromTimespan);
                }
            }

            $scope.$watch("scroll", function (scroll) {
                bounds = scroll;
            });
            $scope.$watch("domainObject", initializeZoom);

            return {
                /**
                 * Increase or decrease the current zoom level by a given
                 * number of steps. Positive steps zoom in, negative steps
                 * zoom out.
                 * If called with no arguments, this returns the current
                 * zoom level, expressed as the number of milliseconds
                 * associated with a given tick mark.
                 * @param {number} steps how many steps to zoom in
                 * @returns {number} current zoom level (as the size of a
                 *          major tick mark, in pixels)
                 */
                zoom: function (amount) {
                    // Update the zoom level if called with an argument
                    if (arguments.length > 0 && !isNaN(amount)) {
                        var center = this.toMillis(bounds.x + bounds.width / 2);
                        setZoomLevel(zoomIndex + amount);
                        bounds.x = this.toPixels(center) - bounds.width / 2;
                    }
                    return zoomLevels[zoomIndex];
                },
                /**
                 * Set the zoom level to fit the bounds of the timeline
                 * being viewed.
                 */
                fit: initializeZoom,
                /**
                 * Get the width, in pixels, of a specific time duration at
                 * the current zoom level.
                 * @returns {number} the number of pixels
                 */
                toPixels: toPixels,
                /**
                 * Get the time duration, in milliseconds, occupied by the
                 * width (specified in pixels) at the current zoom level.
                 * @returns {number} the number of pixels
                 */
                toMillis: toMillis,
                /**
                 * Get or set the current displayed duration. If used as a
                 * setter, this will typically be rounded up to ensure extra
                 * space is available at the right.
                 * @returns {number} duration, in milliseconds
                 */
                duration: function (value) {
                    if (arguments.length > 0) {
                        duration = roundDuration(value);
                    }
                    return duration;
                }
            };
        }

        return TimelineZoomController;

    }
);
