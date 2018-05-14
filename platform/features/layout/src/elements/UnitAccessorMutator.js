/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [],
    function () {

        /**
         * Variant of AccessorMutator to handle the specific case of updating
         * useGrid, in order update the positions appropriately from within
         * the scope of UnitAccessorMutator
         *
         * @memberof platform/features/layout
         * @constructor
         * @param {ElementProxy} proxy ElementProxy object to perform the update
         *                             upon
         */
        function UnitAccessorMutator(elementProxy) {
            var self = this;

            this.elementProxy = elementProxy;
            return function (useGrid) {
                var current = elementProxy.element.useGrid;
                if (arguments.length > 0) {
                    elementProxy.element.useGrid = useGrid;
                    if (useGrid && !current) {
                        self.convertCoordsTo('grid');
                    } else if (!useGrid && current) {
                        self.convertCoordsTo('px');
                    }
                }

                return elementProxy.element.useGrid;
            };
        }

        /**
         * For the elementProxy object called upon, convert its element's
         * coordinates and size from pixels to grid units, or vice-versa.
         * @param {string} unit When called with 'px', converts grid units to
         *                      pixels; when called with 'grid', snaps element
         *                      to grid units
         */
        UnitAccessorMutator.prototype.convertCoordsTo = function (unit) {
            var proxy = this.elementProxy,
                gridSize = proxy.gridSize,
                element = proxy.element,
                minWidth = proxy.getMinWidth(),
                minHeight = proxy.getMinHeight();
            if (unit === 'px') {
                element.x = element.x * gridSize[0];
                element.y = element.y * gridSize[1];
                element.width = element.width * gridSize[0];
                element.height = element.height * gridSize[1];
                if (element.x2 && element.y2) {
                    element.x2 = element.x2 * gridSize[0];
                    element.y2 = element.y2 * gridSize[1];
                }
            } else if (unit === 'grid') {
                element.x = Math.round(element.x / gridSize[0]);
                element.y = Math.round(element.y / gridSize[1]);
                element.width = Math.max(Math.round(element.width / gridSize[0]), minWidth);
                element.height = Math.max(Math.round(element.height / gridSize[1]), minHeight);
                if (element.x2 && element.y2) {
                    element.x2 = Math.round(element.x2 / gridSize[0]);
                    element.y2 = Math.round(element.y2 / gridSize[1]);
                }
            }
        };

        return UnitAccessorMutator;
    }
);
