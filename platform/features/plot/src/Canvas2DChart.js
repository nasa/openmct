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
         * @param {CanvasElement} canvas the canvas object to render upon
         * @throws {Error} an error is thrown if Canvas's 2D API is unavailable.
         */
        function Canvas2DChart(canvas) {
            var c2d = canvas.getContext('2d'),
                width = canvas.width,
                height = canvas.height,
                dimensions = [ width, height ],
                origin = [ 0, 0 ];

            // Convert from logical to physical x coordinates
            function x(v) {
                return ((v - origin[0]) / dimensions[0]) * width;
            }

            // Convert from logical to physical y coordinates
            function y(v) {
                return height - ((v - origin[1]) / dimensions[1]) * height;
            }

            // Set the color to be used for drawing operations
            function setColor(color) {
                var mappedColor = color.map(function (c, i) {
                        return i < 3 ? Math.floor(c * 255) : (c);
                    }).join(',');
                c2d.strokeStyle = "rgba(" + mappedColor + ")";
                c2d.fillStyle = "rgba(" + mappedColor + ")";
            }

            if (!c2d) {
                throw new Error("Canvas 2d API unavailable.");
            }

            return {
                /**
                 * Clear the chart.
                 * @memberof platform/features/plot.Canvas2DChart#
                 */
                clear: function () {
                    width = canvas.width;
                    height = canvas.height;
                    c2d.clearRect(0, 0, width, height);
                },
                /**
                 * Set the logical boundaries of the chart.
                 * @param {number[]} dimensions the horizontal and
                 *        vertical dimensions of the chart
                 * @param {number[]} origin the horizontal/vertical
                 *        origin of the chart
                 * @memberof platform/features/plot.Canvas2DChart#
                 */
                setDimensions: function (newDimensions, newOrigin) {
                    dimensions = newDimensions;
                    origin = newOrigin;
                },
                /**
                 * Draw the supplied buffer as a line strip (a sequence
                 * of line segments), in the chosen color.
                 * @param {Float32Array} buf the line strip to draw,
                 *        in alternating x/y positions
                 * @param {number[]} color the color to use when drawing
                 *        the line, as an RGBA color where each element
                 *        is in the range of 0.0-1.0
                 * @param {number} points the number of points to draw
                 * @memberof platform/features/plot.Canvas2DChart#
                 */
                drawLine: function (buf, color, points) {
                    var i;

                    setColor(color);

                    // Configure context to draw two-pixel-thick lines
                    c2d.lineWidth = 2;

                    // Start a new path...
                    if (buf.length > 1) {
                        c2d.beginPath();
                        c2d.moveTo(x(buf[0]), y(buf[1]));
                    }

                    // ...and add points to it...
                    for (i = 2; i < points * 2; i = i + 2) {
                        c2d.lineTo(x(buf[i]), y(buf[i + 1]));
                    }

                    // ...before finally drawing it.
                    c2d.stroke();
                },
                /**
                 * Draw a rectangle extending from one corner to another,
                 * in the chosen color.
                 * @param {number[]} min the first corner of the rectangle
                 * @param {number[]} max the opposite corner
                 * @param {number[]} color the color to use when drawing
                 *        the rectangle, as an RGBA color where each element
                 *        is in the range of 0.0-1.0
                 * @memberof platform/features/plot.Canvas2DChart#
                 */
                drawSquare: function (min, max, color) {
                    var x1 = x(min[0]),
                        y1 = y(min[1]),
                        w = x(max[0]) - x1,
                        h = y(max[1]) - y1;

                    setColor(color);
                    c2d.fillRect(x1, y1, w, h);
                }
            };
        }

        return Canvas2DChart;
    }
);
