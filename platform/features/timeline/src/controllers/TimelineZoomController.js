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
    [],
    () => {
        let PADDING = 0.25;

        /**
         * Controls the pan-zoom state of a timeline view.
         * @constructor
         */
        const TimelineZoomController = ($scope, $window, ZOOM_CONFIGURATION) => {
            // Prefer to start with the middle index
            let zoomLevels = ZOOM_CONFIGURATION.levels || [1000],
                zoomIndex = Math.floor(zoomLevels.length / 2),
                tickWidth = ZOOM_CONFIGURATION.width || 200;

            const toMillis = (pixels) => {
                return (pixels / tickWidth) * zoomLevels[zoomIndex];
            }

            const toPixels = (millis) => {
                return tickWidth * millis / zoomLevels[zoomIndex];
            }

            // Get/set zoom level
            const setZoomLevel = (level) => {
                if (!isNaN(level)) {
                    // Modify zoom level, keeping it in range
                    zoomIndex = Math.min(
                        Math.max(level, 0),
                        zoomLevels.length - 1
                    );
                }
            }

            const setScroll = (x) => {
                $window.requestAnimationFrame( () => {
                    $scope.scroll.x = x;
                    $scope.$apply();
                });
            }

            const initializeZoomFromTimespan=  (timespan) => {
                let timelineDuration = timespan.getDuration();
                zoomIndex = 0;
                while (toMillis($scope.scroll.width) < timelineDuration &&
                        zoomIndex < zoomLevels.length - 1) {
                    zoomIndex += 1;
                }
                setScroll(toPixels(timespan.getStart()));
            }

            const initializeZoom = () => {
                if ($scope.domainObject) {
                    $scope.domainObject.useCapability('timespan')
                        .then(initializeZoomFromTimespan);
                }
            }

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
                zoom: (amount) => {
                    // Update the zoom level if called with an argument
                    if (arguments.length > 0 && !isNaN(amount)) {
                        let bounds = $scope.scroll;
                        let center = this.toMillis(bounds.x + bounds.width / 2);
                        setZoomLevel(zoomIndex + amount);
                        setScroll(this.toPixels(center) - bounds.width / 2);
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
                 * Get the pixel width necessary to fit the specified
                 * timestamp, expressed as an offset in milliseconds from
                 * the start of the timeline.
                 * @param {number} timestamp the time to display
                 */
                width: (timestamp) => {
                    let pixels = Math.ceil(toPixels(timestamp * (1 + PADDING)));
                    return Math.max($scope.scroll.width, pixels);
                }
            };
        }

        return TimelineZoomController;

    }
);
