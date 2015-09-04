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
        'use strict';

        /**
         * Handle for changing x/y position of a line's end point.
         * This is used to support drag handles for line elements
         * in a fixed position view. Field names for opposite ends
         * are provided to avoid zero-length lines.
         * @memberof platform/features/layout
         * @constructor
         * @param element the line element
         * @param {string} xProperty field which stores x position
         * @param {string} yProperty field which stores x position
         * @param {string} xOther field which stores x of other end
         * @param {string} yOther field which stores y of other end
         * @implements {platform/features/layout.ElementHandle}
         */
        function LineHandle(element, xProperty, yProperty, xOther, yOther) {
            this.element = element;
            this.xProperty = xProperty;
            this.yProperty = yProperty;
            this.xOther = xOther;
            this.yOther = yOther;
        }

        LineHandle.prototype.x = function (value) {
            var element = this.element,
                xProperty = this.xProperty,
                yProperty = this.yProperty,
                xOther = this.xOther,
                yOther = this.yOther;

            if (arguments.length > 0) {
                // Ensure we stay in view
                value = Math.max(value, 0);
                // Make sure end points will still be different
                if (element[yOther] !== element[yProperty] ||
                    element[xOther] !== value) {
                    element[xProperty] = value;
                }
            }
            return element[xProperty];
        };

        LineHandle.prototype.y = function (value) {
            var element = this.element,
                xProperty = this.xProperty,
                yProperty = this.yProperty,
                xOther = this.xOther,
                yOther = this.yOther;

            if (arguments.length > 0) {
                // Ensure we stay in view
                value = Math.max(value, 0);
                // Make sure end points will still be different
                if (element[xOther] !== element[xProperty] ||
                    element[yOther] !== value) {
                    element[yProperty] = value;
                }
            }
            return element[yProperty];
        };

        return LineHandle;

    }
);
