/*global define,Promise,Float32Array*/

/**
 * Module defining GLPlot. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

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

        function GLPlot(canvas) {
            var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
                vertexShader,
                fragmentShader,
                program,
                aVertexPosition,
                uColor,
                uDimensions,
                uOrigin,
                buffer;

            if (!gl) {
                return false;
            }

            // Initialize shaders
            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, VERTEX_SHADER);
            gl.compileShader(vertexShader);
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
            gl.compileShader(fragmentShader);

            program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
            gl.enableVertexAttribArray(aVertexPosition);

            uColor = gl.getUniformLocation(program, "uColor");
            uDimensions = gl.getUniformLocation(program, "uDimensions");
            uOrigin = gl.getUniformLocation(program, "uOrigin");

            buffer = gl.createBuffer();

            gl.lineWidth(2.0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            function doDraw(drawType, buf, color, points) {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, buf, gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
                gl.uniform4fv(uColor, color);
                gl.drawArrays(drawType, 0, points);
            }

            return {
                clear: function () {
                    gl.viewport(0, 0, canvas.width, canvas.height);
                    gl.clear(gl.COLOR_BUFFER_BIT + gl.DEPTH_BUFFER_BIT);
                },
                setDimensions: function (dimensions, origin) {
                    gl.uniform2fv(uDimensions, dimensions);
                    gl.uniform2fv(uOrigin, origin);
                },
                drawLine: function (buf, color, points) {
                    doDraw(gl.LINE_STRIP, buf, color, points);
                },
                drawSquare: function (min, max, color) {
                    doDraw(gl.TRIANGLE_FAN, new Float32Array(
                        min.concat([min[0], max[1]]).concat(max).concat([max[0], min[1]])
                    ), color, 4);
                },
                gl: gl
            };
        }
        return GLPlot;
    }
);