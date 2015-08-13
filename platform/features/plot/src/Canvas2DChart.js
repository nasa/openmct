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
/*global define,Float32Array*/

define(
    [],
    function () {
        "use strict";

        /**
         * Create a new chart which uses Canvas's 2D API for rendering.
         *
         * @memberof platform/features/plot
         * @constructor
         * @implements {platform/features/plot.Chart}
         * @param {CanvasElement} canvas the canvas object to render upon
         * @throws {Error} an error is thrown if Canvas's 2D API is unavailable.
         */
        function Canvas2DChart(canvas) {
            this.canvas = canvas;
            this.c2d = canvas.getContext('2d');
            this.width = canvas.width;
            this.height = canvas.height;
            this.dimensions = [ this.width, this.height ];
            this.origin = [ 0, 0 ];

            if (!this.c2d) {
                throw new Error("Canvas 2d API unavailable.");
            }
        }

        // Convert from logical to physical x coordinates
        Canvas2DChart.prototype.x = function (v) {
            return ((v - this.origin[0]) / this.dimensions[0]) * this.width;
        };

        // Convert from logical to physical y coordinates
        Canvas2DChart.prototype.y = function (v) {
            return this.height -
                ((v - this.origin[1]) / this.dimensions[1]) * this.height;
        };

        // Set the color to be used for drawing operations
        Canvas2DChart.prototype.setColor = function (color) {
            var mappedColor = color.map(function (c, i) {
                return i < 3 ? Math.floor(c * 255) : (c);
            }).join(',');
            this.c2d.strokeStyle = "rgba(" + mappedColor + ")";
            this.c2d.fillStyle = "rgba(" + mappedColor + ")";
        };


        Canvas2DChart.prototype.clear = function () {
            var canvas = this.canvas;
            this.width = canvas.width;
            this.height = canvas.height;
            this.c2d.clearRect(0, 0, this.width, this.height);
        };

        Canvas2DChart.prototype.setDimensions = function (newDimensions, newOrigin) {
            this.dimensions = newDimensions;
            this.origin = newOrigin;
        };

        Canvas2DChart.prototype.drawLine = function (buf, color, points) {
            var i;

            this.setColor(color);

            // Configure context to draw two-pixel-thick lines
            this.c2d.lineWidth = 2;

            // Start a new path...
            if (buf.length > 1) {
                this.c2d.beginPath();
                this.c2d.moveTo(this.x(buf[0]), this.y(buf[1]));
            }

            // ...and add points to it...
            for (i = 2; i < points * 2; i = i + 2) {
                this.c2d.lineTo(this.x(buf[i]), this.y(buf[i + 1]));
            }

            // ...before finally drawing it.
            this.c2d.stroke();
        };

        Canvas2DChart.prototype.drawSquare = function (min, max, color) {
            var x1 = this.x(min[0]),
                y1 = this.y(min[1]),
                w = this.x(max[0]) - x1,
                h = this.y(max[1]) - y1;

            this.setColor(color);
            this.c2d.fillRect(x1, y1, w, h);
        };

        return Canvas2DChart;
    }
);
