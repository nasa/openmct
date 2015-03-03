/*global define*/

define(
    ['./AccessorMutator'],
    function (AccessorMutator) {
        "use strict";

        /**
         * Abstract superclass for other classes which provide useful
         * interfaces upon an elements in a fixed position view.
         * This handles the generic operations (e.g. remove) so that
         * subclasses only need to implement element-specific behaviors.
         * @constructor
         * @param element the fixed position element, as stored in its
         *        configuration
         * @param index the element's index within its array
         * @param {Array} elements the full array of elements
         */
        function ElementProxy(element, index, elements) {
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
                 * Get and/or set the z index of this element.
                 * @param {number} [z] the new z index (if setting)
                 * @returns {number} the z index
                 */
                z: new AccessorMutator(element, 'z'),
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
                 * Remove this element from the fixed position view.
                 */
                remove: function () {
                    if (elements[index] === element) {
                        elements.splice(index, 1);
                    }
                }
            };
        }

        return ElementProxy;
    }
);