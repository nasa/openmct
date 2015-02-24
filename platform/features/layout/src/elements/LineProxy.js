/*global define*/

define(
    ['./ElementProxy'],
    function (ElementProxy) {
        'use strict';

        /**
         * Selection/diplay proxy for line elements of a fixed position
         * view.
         * @constructor
         * @param element the fixed position element, as stored in its
         *        configuration
         * @param index the element's index within its array
         * @param {Array} elements the full array of elements
         */
        function LineProxy(element, index, elements) {
            var proxy = new ElementProxy(element, index, elements);

            /**
             * Get the top-left x coordinate, in grid space, of
             * this line's bounding box.
             * @returns {number} the x coordinate
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
             */
            proxy.width = function () {
                return Math.max(Math.abs(element.x - element.x2), 1);
            };

            /**
             * Get the height, in grid space, of
             * this line's bounding box.
             * @returns {number} the height
             */
            proxy.height = function () {
                return Math.max(Math.abs(element.y - element.y2), 1);
            };

            /**
             * Get the x position, in grid units relative to
             * the top-left corner, of the first point in this line
             * segment.
             * @returns {number} the x position of the first point
             */
            proxy.x1 = function () {
                return element.x - proxy.x();
            };

            /**
             * Get the y position, in grid units relative to
             * the top-left corner, of the first point in this line
             * segment.
             * @returns {number} the y position of the first point
             */
            proxy.y1 = function () {
                return element.y - proxy.y();
            };

            /**
             * Get the x position, in grid units relative to
             * the top-left corner, of the second point in this line
             * segment.
             * @returns {number} the x position of the second point
             */
            proxy.x2 = function () {
                return element.x2 - proxy.x();
            };

            /**
             * Get the y position, in grid units relative to
             * the top-left corner, of the second point in this line
             * segment.
             * @returns {number} the y position of the second point
             */
            proxy.y2 = function () {
                return element.y2 - proxy.y();
            };

            return proxy;
        }

        return LineProxy;
    }
);