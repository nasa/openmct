/*global define*/

define(
    ['./ElementProxy', './AccessorMutator'],
    function (ElementProxy, AccessorMutator) {
        'use strict';

        /**
         * Selection proxy for Box elements in a fixed position view.
         * Also serves as a superclass for Text elements, since those
         * elements have a superset of Box properties.
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
        function BoxProxy(element, index, elements) {
            var proxy = new ElementProxy(element, index, elements);

            /**
             * Get/set this element's fill color. (Omitting the
             * argument makes this act as a getter.)
             * @method
             * @memberof BoxProxy
             * @param {string} fill the new fill color
             * @returns {string} the fill color
             */
            proxy.fill = new AccessorMutator(element, 'fill');

            return proxy;
        }

        return BoxProxy;
    }
);