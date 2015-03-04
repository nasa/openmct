/*global define*/

define(
    ['./BoxProxy', './AccessorMutator'],
    function (BoxProxy, AccessorMutator) {
        'use strict';

        /**
         * Selection proxy for Text elements in a fixed position view.
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
        function TextProxy(element, index, elements) {
            var proxy = new BoxProxy(element, index, elements);

            /**
             * Get and/or set the text color of this element.
             * @param {string} [color] the new text color (if setting)
             * @returns {string} the text color
             */
            proxy.color = new AccessorMutator(element, 'color');

            /**
             * Get and/or set the displayed text of this element.
             * @param {string} [text] the new text (if setting)
             * @returns {string} the text
             */
            proxy.text = new AccessorMutator(element, 'text');

            return proxy;
        }

        return TextProxy;
    }
);