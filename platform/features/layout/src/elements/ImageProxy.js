/*global define*/

define(
    ['./ElementProxy', './AccessorMutator'],
    function (ElementProxy, AccessorMutator) {
        'use strict';

        /**
         * Selection proxy for Image elements in a fixed position view.
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
        function ImageProxy(element, index, elements) {
            var proxy = new ElementProxy(element, index, elements);

            /**
             * Get and/or set the displayed text of this element.
             * @param {string} [text] the new text (if setting)
             * @returns {string} the text
             */
            proxy.url = new AccessorMutator(element, 'url');

            return proxy;
        }

        return ImageProxy;
    }
);