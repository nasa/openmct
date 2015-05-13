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
         * Handle for changing width/height properties of an element.
         * This is used to support drag handles for different
         * element types in a fixed position view.
         * @constructor
         */
        function ResizeHandle(element, minWidth, minHeight) {
            // Ensure reasonable defaults
            minWidth = minWidth || 0;
            minHeight = minHeight || 0;

            return {
                /**
                 * Get/set the x position of the lower-right corner
                 * of the handle-controlled element, changing size
                 * as necessary.
                 */
                x: function (value) {
                    if (arguments.length > 0) {
                        element.width = Math.max(
                            minWidth,
                            value - element.x
                        );
                    }
                    return element.x + element.width;
                },
                /**
                 * Get/set the y position of the lower-right corner
                 * of the handle-controlled element, changing size
                 * as necessary.
                 */
                y: function (value) {
                    if (arguments.length > 0) {
                        element.height = Math.max(
                            minHeight,
                            value - element.y
                        );
                    }
                    return element.y + element.height;
                }
            };
        }

        return ResizeHandle;

    }
);