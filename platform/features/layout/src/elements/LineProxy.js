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
    ['./ElementProxy', './LineHandle'],
    function (ElementProxy, LineHandle) {
        'use strict';

        /**
         * Selection/diplay proxy for line elements of a fixed position
         * view.
         * @memberof platform/features/layout
         * @constructor
         * @param element the fixed position element, as stored in its
         *        configuration
         * @param index the element's index within its array
         * @param {Array} elements the full array of elements
         * @augments {platform/features/layout.ElementProxy}
         */
        function LineProxy(element, index, elements) {
            var proxy = new ElementProxy(element, index, elements),
                handles = [
                    new LineHandle(element, 'x', 'y', 'x2', 'y2'),
                    new LineHandle(element, 'x2', 'y2', 'x', 'y')
                ];

            /**
             * Get the top-left x coordinate, in grid space, of
             * this line's bounding box.
             * @returns {number} the x coordinate
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.x = function (v) {
                var x = Math.min(element.x, element.x2),
                    delta = Math.max(v, 0) - x;
                if (arguments.length > 0 && delta) {
                    element.x += delta;
                    element.x2 += delta;
                }
                return x;
            };

            /**
             * Get the top-left y coordinate, in grid space, of
             * this line's bounding box.
             * @returns {number} the y coordinate
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.y = function (v) {
                var y = Math.min(element.y, element.y2),
                    delta = Math.max(v, 0) - y;
                if (arguments.length > 0 && delta) {
                    element.y += delta;
                    element.y2 += delta;
                }
                return y;
            };

            /**
             * Get the width, in grid space, of
             * this line's bounding box.
             * @returns {number} the width
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.width = function () {
                return Math.max(Math.abs(element.x - element.x2), 1);
            };

            /**
             * Get the height, in grid space, of
             * this line's bounding box.
             * @returns {number} the height
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.height = function () {
                return Math.max(Math.abs(element.y - element.y2), 1);
            };

            /**
             * Get the x position, in grid units relative to
             * the top-left corner, of the first point in this line
             * segment.
             * @returns {number} the x position of the first point
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.x1 = function () {
                return element.x - proxy.x();
            };

            /**
             * Get the y position, in grid units relative to
             * the top-left corner, of the first point in this line
             * segment.
             * @returns {number} the y position of the first point
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.y1 = function () {
                return element.y - proxy.y();
            };

            /**
             * Get the x position, in grid units relative to
             * the top-left corner, of the second point in this line
             * segment.
             * @returns {number} the x position of the second point
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.x2 = function () {
                return element.x2 - proxy.x();
            };

            /**
             * Get the y position, in grid units relative to
             * the top-left corner, of the second point in this line
             * segment.
             * @returns {number} the y position of the second point
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.y2 = function () {
                return element.y2 - proxy.y();
            };

            /**
             * Get element handles for changing the position of end
             * points of this line.
             * @returns {LineHandle[]} line handles for both end points
             * @memberof platform/features/layout.LineProxy#
             */
            proxy.handles = function () {
                return handles;
            };

            return proxy;
        }

        return LineProxy;
    }
);
