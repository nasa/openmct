/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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
         * A PlotPosition converts from pixel coordinates to domain-range
         * coordinates, based on the current plot boundary as described on
         * the pan-zoom stack.
         *
         * These coordinates are not updated after construction; that is,
         * they represent the result of the conversion at the time the
         * PlotPosition was instantiated. Care should be taken when retaining
         * PlotPosition objects across changes to the pan-zoom stack.
         *
         * @memberof platform/features/plot
         * @constructor
         * @param {number} x the horizontal pixel position in the plot area
         * @param {number} y the vertical pixel position in the plot area
         * @param {number} width the width of the plot area
         * @param {number} height the height of the plot area
         * @param {PanZoomStack} panZoomStack the applicable pan-zoom stack,
         *        used to determine the plot's domain-range boundaries.
         */
        function PlotPosition(x, y, width, height, panZoomStack) {
            var panZoom = panZoomStack.getPanZoom(),
                origin = panZoom.origin,
                dimensions = panZoom.dimensions;

            function convert(v, i) {
                return v * dimensions[i] + origin[i];
            }

            if (!dimensions || !origin) {
                // We need both dimensions and origin to compute a position
                this.position = [];
            } else {
                // Convert from pixel to domain-range space.
                // Note that range is reversed from the y-axis in pixel space
                //(positive range points up, positive pixel-y points down)
                this.position =
                    [ x / width, (height - y) / height ].map(convert);
            }
        }

        /**
         * Get the domain value corresponding to this pixel position.
         * @returns {number} the domain value
         */
        PlotPosition.prototype.getDomain = function () {
            return this.position[0];
        };

        /**
         * Get the range value corresponding to this pixel position.
         * @returns {number} the range value
         */
        PlotPosition.prototype.getRange = function () {
            return this.position[1];
        };

        /**
         * Get the domain and values corresponding to this
         * pixel position.
         * @returns {number[]} an array containing the domain and
         *          the range value, in that order
         */
        PlotPosition.prototype.getPosition = function () {
            return this.position;
        };

        return PlotPosition;
    }
);
