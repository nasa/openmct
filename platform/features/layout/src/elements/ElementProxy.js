/*global define*/

define(
    ['./Accessor'],
    function (Accessor) {
        "use strict";

        /**
         * Abstract superclass for other classes which provide useful
         * interfaces upon an elements in a fixed position view.
         * This handles the generic operations (e.g. remove) so that
         * subclasses only need to implement element-specific behaviors.
         * @constructor
         * @param element the telemetry element
         * @param index the element's index within its array
         * @param {Array} elements the full array of elements
         */
        function ElementProxy(element, index, elements) {
            return {
                element: element,
                x: new Accessor(element, 'x'),
                y: new Accessor(element, 'y'),
                z: new Accessor(element, 'z'),
                width: new Accessor(element, 'width'),
                height: new Accessor(element, 'height'),
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