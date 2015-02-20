/*global define,window*/

define(
    [],
    function () {
        "use strict";

        /**
         * Proxy for configuring a fixed position view via the toolbar.
         * @constructor
         * @param configuration the view configuration object
         */
        function FixedProxy(configuration) {
            return {
                /**
                 * Add a new visual element to this view.
                 */
                add: function (type) {
                    configuration.elements = configuration.elements || [];
                    configuration.elements.push({
                        x: configuration.elements.length,
                        y: configuration.elements.length,
                        width: 2,
                        height: 1,
                        type: type
                    });
                }
            };
        }

        return FixedProxy;
    }
);