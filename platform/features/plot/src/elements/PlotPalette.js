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

/**
 * Plot palette. Defines colors for various plot lines.
 */
define(
    function () {
        'use strict';

        // Prepare different forms of the palette, since we wish to
        // describe colors in several ways (as RGB 0-255, as
        // RGB 0.0-1.0, or as stylesheet-appropriate #-prefixed colors).
        var integerPalette = [
            [ 0x20, 0xB2, 0xAA ],
            [ 0x9A, 0xCD, 0x32 ],
            [ 0xFF, 0x8C, 0x00 ],
            [ 0xD2, 0xB4, 0x8C ],
            [ 0x40, 0xE0, 0xD0 ],
            [ 0x41, 0x69, 0xFF ],
            [ 0xFF, 0xD7, 0x00 ],
            [ 0x6A, 0x5A, 0xCD ],
            [ 0xEE, 0x82, 0xEE ],
            [ 0xCC, 0x99, 0x66 ],
            [ 0x99, 0xCC, 0xCC ],
            [ 0x66, 0xCC, 0x33 ],
            [ 0xFF, 0xCC, 0x00 ],
            [ 0xFF, 0x66, 0x33 ],
            [ 0xCC, 0x66, 0xFF ],
            [ 0xFF, 0x00, 0x66 ],
            [ 0xFF, 0xFF, 0x00 ],
            [ 0x80, 0x00, 0x80 ],
            [ 0x00, 0x86, 0x8B ],
            [ 0x00, 0x8A, 0x00 ],
            [ 0xFF, 0x00, 0x00 ],
            [ 0x00, 0x00, 0xFF ],
            [ 0xF5, 0xDE, 0xB3 ],
            [ 0xBC, 0x8F, 0x8F ],
            [ 0x46, 0x82, 0xB4 ],
            [ 0xFF, 0xAF, 0xAF ],
            [ 0x43, 0xCD, 0x80 ],
            [ 0xCD, 0xC1, 0xC5 ],
            [ 0xA0, 0x52, 0x2D ],
            [ 0x64, 0x95, 0xED ]
        ], stringPalette = integerPalette.map(function (arr) {
            // Convert to # notation for use in styles
            return '#' + arr.map(function (c) {
                return (c < 16 ? '0' : '') + c.toString(16);
            }).join('');
        }), floatPalette = integerPalette.map(function (arr) {
            return arr.map(function (c) {
                return c / 255.0;
            }).concat([1]); // RGBA
        });

        /**
         * PlotPalette allows a consistent set of colors to be retrieved
         * by index, in various color formats. All PlotPalette methods are
         * static, so there is no need for a constructor call; using
         * this will simply return PlotPalette itself.
         * @memberof platform/features/plot
         * @constructor
         */
        function PlotPalette() {
            return PlotPalette;
        }

        /**
         * Look up a color in the plot's palette, by index.
         * This will be returned as a three element array of RGB
         * values, as integers in the range of 0-255.
         * @param {number} i the index of the color to look up
         * @return {number[]} the color, as integer RGB values
         */
        PlotPalette.getIntegerColor = function (i) {
            return integerPalette[Math.floor(i) % integerPalette.length];
        };


        /**
         * Look up a color in the plot's palette, by index.
         * This will be returned as a three element array of RGB
         * values, in the range of 0.0-1.0.
         *
         * This format is present specifically to support use with
         * WebGL, which expects colors of that form.
         *
         * @param {number} i the index of the color to look up
         * @return {number[]} the color, as floating-point RGB values
         */
        PlotPalette.getFloatColor = function (i) {
            return floatPalette[Math.floor(i) % floatPalette.length];
        };


        /**
         * Look up a color in the plot's palette, by index.
         * This will be returned as a string using #-prefixed
         * six-digit RGB hex notation (e.g. #FF0000)
         * See http://www.w3.org/TR/css3-color/#rgb-color.
         *
         * This format is useful for representing colors in in-line
         * styles.
         *
         * @param {number} i the index of the color to look up
         * @return {string} the color, as a style-friendly string
         */
        PlotPalette.getStringColor = function (i) {
            return stringPalette[Math.floor(i) % stringPalette.length];
        };

        return PlotPalette;

    }
);
