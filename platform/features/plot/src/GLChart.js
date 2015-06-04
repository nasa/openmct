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

/**
 * Module defining GLPlot. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        // WebGL shader sources (for drawing plain colors)
        var FRAGMENT_SHADER = [
                "precision mediump float;",
                "uniform vec4 uColor;",
                "void main(void) {",
                "gl_FragColor = uColor;",
                "}"
            ].join('\n'),
            VERTEX_SHADER = [
                "attribute vec2 aVertexPosition;",
                "uniform vec2 uDimensions;",
                "uniform vec2 uOrigin;",
                "void main(void) {",
                "gl_Position = vec4(2.0 * ((aVertexPosition - uOrigin) / uDimensions) - vec2(1,1), 0, 1);",
                "}"
            ].join('\n');

        /**
         * Create a new chart which uses WebGL for rendering.
         *
         * @constructor
         * @param {CanvasElement} canvas the canvas object to render upon
         * @throws {Error} an error is thrown if WebGL is unavailable.
         */
        function GLChart(canvas) {
            var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
                vertexShader,
                fragmentShader,
                program,
                aVertexPosition,
                uColor,
                uDimensions,
                uOrigin,
                buffer;

            // Ensure a context was actually available before proceeding
            if (!gl) {
                throw new Error("WebGL unavailable.");
            }

            // Initialize shaders
            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, VERTEX_SHADER);
            gl.compileShader(vertexShader);
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
            gl.compileShader(fragmentShader);

            // Assemble vertex/fragment shaders into programs
            program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            // Get locations for attribs/uniforms from the
            // shader programs (to pass values into shaders at draw-time)
            aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
            uColor = gl.getUniformLocation(program, "uColor");
            uDimensions = gl.getUniformLocation(program, "uDimensions");
            uOrigin = gl.getUniformLocation(program, "uOrigin");
            gl.enableVertexAttribArray(aVertexPosition);

            // Create a buffer to holds points which will be drawn
            buffer = gl.createBuffer();

            // Use a line width of 2.0 for legibility
            gl.lineWidth(2.0);

            // Enable blending, for smoothness
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            // Utility function to handle drawing of a buffer;
            // drawType will determine whether this is a box, line, etc.
            function doDraw(drawType, buf, color, points) {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, buf, gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
                gl.uniform4fv(uColor, color);
                gl.drawArrays(drawType, 0, points);
            }

            return {
                /**
                 * Clear the chart.
                 */
                clear: function () {
                    // Set the viewport size; note that we use the width/height
                    // that our WebGL context reports, which may be lower
                    // resolution than the canvas we requested.
                    gl.viewport(
                        0,
                        0,
                        gl.drawingBufferWidth,
                        gl.drawingBufferHeight
                    );
                    gl.clear(gl.COLOR_BUFFER_BIT + gl.DEPTH_BUFFER_BIT);
                },
                /**
                 * Set the logical boundaries of the chart.
                 * @param {number[]} dimensions the horizontal and
                 *        vertical dimensions of the chart
                 * @param {number[]} origin the horizontal/vertical
                 *        origin of the chart
                 */
                setDimensions: function (dimensions, origin) {
                    if (dimensions && dimensions.length > 0 &&
                            origin && origin.length > 0) {
                        gl.uniform2fv(uDimensions, dimensions);
                        gl.uniform2fv(uOrigin, origin);
                    }
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
                 */
                drawLine: function (buf, color, points) {
                    doDraw(gl.LINE_STRIP, buf, color, points);
                },
                /**
                 * Draw a rectangle extending from one corner to another,
                 * in the chosen color.
                 * @param {number[]} min the first corner of the rectangle
                 * @param {number[]} max the opposite corner
                 * @param {number[]} color the color to use when drawing
                 *        the rectangle, as an RGBA color where each element
                 *        is in the range of 0.0-1.0
                 */
                drawSquare: function (min, max, color) {
                    doDraw(gl.TRIANGLE_FAN, new Float32Array(
                        min.concat([min[0], max[1]]).concat(max).concat([max[0], min[1]])
                    ), color, 4);
                }
            };
        }
        return GLChart;
    }
);