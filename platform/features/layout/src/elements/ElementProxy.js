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
    ['./AccessorMutator', './ResizeHandle'],
    function (AccessorMutator, ResizeHandle) {
        "use strict";

        // Index deltas for changes in order
        var ORDERS = {
            top: Number.POSITIVE_INFINITY,
            up: 1,
            down: -1,
            bottom: Number.NEGATIVE_INFINITY
        };

        // Ensure a value is non-negative (for x/y setters)
        function clamp(value) {
            return Math.max(value, 0);
        }

        /**
         * Abstract superclass for other classes which provide useful
         * interfaces upon an elements in a fixed position view.
         * This handles the generic operations (e.g. remove) so that
         * subclasses only need to implement element-specific behaviors.
         *
         * Note that arguments here are meant to match those expected
         * by `Array.prototype.map`
         *
         * @memberof platform/features/layout
         * @constructor
         * @param element the fixed position element, as stored in its
         *        configuration
         * @param index the element's index within its array
         * @param {Array} elements the full array of elements
         */
        function ElementProxy(element, index, elements) {
            this.resizeHandles = [ new ResizeHandle(element, 1, 1) ];

            /**
             * The element as stored in the view configuration.
             * @memberof platform/features/layout.ElementProxy#
             */
            this.element = element;

            /**
             * Get and/or set the x position of this element.
             * Units are in fixed position grid space.
             * @param {number} [x] the new x position (if setting)
             * @returns {number} the x position
             * @memberof platform/features/layout.ElementProxy#
             */
            this.x = new AccessorMutator(element, 'x', clamp);

            /**
             * Get and/or set the y position of this element.
             * Units are in fixed position grid space.
             * @param {number} [y] the new y position (if setting)
             * @returns {number} the y position
             * @memberof platform/features/layout.ElementProxy#
             */
            this.y = new AccessorMutator(element, 'y', clamp);

            /**
             * Get and/or set the stroke color of this element.
             * @param {string} [stroke] the new stroke color (if setting)
             * @returns {string} the stroke color
             * @memberof platform/features/layout.ElementProxy#
             */
            this.stroke = new AccessorMutator(element, 'stroke');

            /**
             * Get and/or set the width of this element.
             * Units are in fixed position grid space.
             * @param {number} [w] the new width (if setting)
             * @returns {number} the width
             * @memberof platform/features/layout.ElementProxy#
             */
            this.width = new AccessorMutator(element, 'width');

            /**
             * Get and/or set the height of this element.
             * Units are in fixed position grid space.
             * @param {number} [h] the new height (if setting)
             * @returns {number} the height
             * @memberof platform/features/layout.ElementProxy#
             */
            this.height = new AccessorMutator(element, 'height');

            this.index = index;
            this.elements = elements;
        }

        /**
         * Change the display order of this element.
         * @param {string} o where to move this element;
         *        one of "top", "up", "down", or "bottom"
         */
        ElementProxy.prototype.order = function (o) {
            var index = this.index,
                elements = this.elements,
                element = this.element,
                delta = ORDERS[o] || 0,
                desired = Math.max(
                    Math.min(index + delta, elements.length - 1),
                    0
                );
            // Move to the desired index, if this is a change
            if ((desired !== index) && (elements[index] === element)) {
                // Splice out the current element
                elements.splice(index, 1);
                // Splice it back in at the correct index
                elements.splice(desired, 0, element);
                // Track change in index (proxy should be recreated
                // anyway, but be consistent)
                this.index = desired;
            }
        };

        /**
         * Remove this element from the fixed position view.
         */
        ElementProxy.prototype.remove = function () {
            var index = this.index;
            if (this.elements[index] === this.element) {
                this.elements.splice(index, 1);
            }
        };

        /**
         * Get handles to control specific features of this element,
         * e.g. corner size.
         * @return {platform/features/layout.ElementHandle[]} handles
         *         for moving/resizing this element
         */
        ElementProxy.prototype.handles = function () {
            return this.resizeHandles;
        };

        return ElementProxy;
    }
);
