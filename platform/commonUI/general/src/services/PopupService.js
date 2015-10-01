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
    function () {
        "use strict";

        /**
         * Displays popup elements at specific positions within the document.
         * @memberof platform/commonUI/general
         * @constructor
         */
        function PopupService($document, $window) {
            this.$document = $document;
            this.$window = $window;
        }

        /**
         * Options controlling how the popup is displaed.
         *
         * @typedef PopupOptions
         * @memberof platform/commonUI/general
         * @property {number} [offsetX] the horizontal distance, in pixels,
         *           to offset the element in whichever direction it is
         *           displayed. Defaults to 0.
         * @property {number} [offsetY] the vertical distance, in pixels,
         *           to offset the element in whichever direction it is
         *           displayed. Defaults to 0.
         * @property {number} [marginX] the horizontal position, in pixels,
         *           after which to prefer to display the element to the left.
         *           If negative, this is relative to the right edge of the
         *           page. Defaults to half the window's width.
         * @property {number} [marginY] the vertical position, in pixels,
         *           after which to prefer to display the element upward.
         *           If negative, this is relative to the right edge of the
         *           page. Defaults to half the window's height.
         * @property {string} [leftClass] class to apply when shifting to the left
         * @property {string} [rightClass] class to apply when shifting to the right
         * @property {string} [upClass] class to apply when shifting upward
         * @property {string} [downClass] class to apply when shifting downward
         */

        /**
         * Display a popup at a particular location. The location chosen will
         * be the corner of the element; the element will be positioned either
         * to the left or the right of this point depending on available
         * horizontal space, and will similarly be shifted upward or downward
         * depending on available vertical space.
         *
         * @param element the jqLite-wrapped DOM element to pop up
         * @param {number[]} position x,y position of the element, in
         *        pixel coordinates. Negative values are interpreted as
         *        relative to the right or bottom of the window.
         * @param {PopupOptions} [options] additional options to control
         *        positioning of the popup
         * @returns {Function} a function that may be invoked to
         *          dismiss the info bubble
         */
        PopupService.prototype.display = function (element, position, options) {
            var $document = this.$document,
                $window = this.$window,
                body = $document.find('body'),
                winDim = [ $window.innerWidth, $window.innerHeight ],
                margin,
                offset,
                bubble;

            function applyClassOption(direction) {
                if (options[direction + 'Class']) {
                    element.addClass(options[direction + 'Class']);
                }
            }

            function adjustNegatives(value, index) {
                return value < 0 ? (value + winDim[index]) : value;
            }

            // Defaults
            options = options || {};
            offset = [
                options.offsetX !== undefined ? options.offsetX : 0,
                options.offsetY !== undefined ? options.offsetY : 0
            ];
            margin = [ options.marginX, options.marginY ].map(function (m, i) {
                return m === undefined ? (winDim[i] / 2) : m;
            }).map(adjustNegatives);

            position = position.map(adjustNegatives);

            // Position the element
            element.css('position', 'absolute');

            if (position[0] > margin[0]) {
                element.css('right', (winDim[0] - position[0] + offset[0]) + 'px');
                applyClassOption('left');
            } else {
                element.css('left', position[0] + offset[0] + 'px');
                applyClassOption('right');
            }

            if (position[1] > margin[1]) {
                element.css('bottom', (winDim[1] - position[1] + offset[1]) + 'px');
                applyClassOption('up');
            } else {
                element.css('top', position[1] + offset[1] + 'px');
                applyClassOption('down');
            }

            // Add the menu to the body
            body.append(element);

            // Return a function to dismiss the bubble
            return function () {
                element.remove();
            };
        };

        return PopupService;
    }
);

