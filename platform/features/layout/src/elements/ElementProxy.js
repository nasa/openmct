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

        /**
         * Abstract superclass for other classes which provide useful
         * interfaces upon an elements in a fixed position view.
         * This handles the generic operations (e.g. remove) so that
         * subclasses only need to implement element-specific behaviors.
         *
         * Note that arguments here are meant to match those expected
         * by `Array.prototype.map`
         *
         * @constructor
         * @param element the fixed position element, as stored in its
         *        configuration
         * @param index the element's index within its array
         * @param {Array} elements the full array of elements
         */
        function ElementProxy(element, index, elements) {
            var handles = [ new ResizeHandle(element, 1, 1) ];

            return {
                /**
                 * The element as stored in the view configuration.
                 */
                element: element,
                /**
                 * Get and/or set the x position of this element.
                 * Units are in fixed position grid space.
                 * @param {number} [x] the new x position (if setting)
                 * @returns {number} the x position
                 */
                x: new AccessorMutator(element, 'x'),
                /**
                 * Get and/or set the y position of this element.
                 * Units are in fixed position grid space.
                 * @param {number} [y] the new y position (if setting)
                 * @returns {number} the y position
                 */
                y: new AccessorMutator(element, 'y'),
                /**
                 * Get and/or set the stroke color of this element.
                 * @param {string} [stroke] the new stroke color (if setting)
                 * @returns {string} the stroke color
                 */
                stroke: new AccessorMutator(element, 'stroke'),
                /**
                 * Get and/or set the width of this element.
                 * Units are in fixed position grid space.
                 * @param {number} [w] the new width (if setting)
                 * @returns {number} the width
                 */
                width: new AccessorMutator(element, 'width'),
                /**
                 * Get and/or set the height of this element.
                 * Units are in fixed position grid space.
                 * @param {number} [h] the new height (if setting)
                 * @returns {number} the height
                 */
                height: new AccessorMutator(element, 'height'),
                /**
                 * Change the display order of this element.
                 * @param {string} o where to move this element;
                 *        one of "top", "up", "down", or "bottom"
                 */
                order: function (o) {
                    var delta = ORDERS[o] || 0,
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
                        index = desired;
                    }
                },
                /**
                 * Remove this element from the fixed position view.
                 */
                remove: function () {
                    if (elements[index] === element) {
                        elements.splice(index, 1);
                    }
                },
                /**
                 * Get handles to control specific features of this element,
                 * e.g. corner size.
                 */
                handles: function () {
                    return handles;
                }
            };
        }

        return ElementProxy;
    }
);