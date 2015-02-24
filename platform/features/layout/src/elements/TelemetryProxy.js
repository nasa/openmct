/*global define*/

define(
    ['./TextProxy', './AccessorMutator'],
    function (TextProxy, AccessorMutator) {
        'use strict';

        // Method names to expose from this proxy
        var HIDE = 'hideTitle', SHOW = 'showTitle';

        /**
         * Selection proxy for telemetry elements in a fixed position view.
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
        function TelemetryProxy(element, index, elements) {
            var proxy = new TextProxy(element, index, elements);

            // Toggle the visibility of the title
            function toggle() {
                // Toggle the state
                element.titled = !element.titled;

                // Change which method is exposed, to influence
                // which button is shown in the toolbar
                delete proxy[SHOW];
                delete proxy[HIDE];
                proxy[element.titled ? HIDE : SHOW] = toggle;
            }

            // Expose the domain object identifier
            proxy.id = element.id;

            // Expose initial toggle
            proxy[element.titled ? HIDE : SHOW] = toggle;

            // Don't expose text configuration
            delete proxy.text;

            return proxy;
        }

        return TelemetryProxy;
    }
);