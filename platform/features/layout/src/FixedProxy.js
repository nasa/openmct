/*global define,window*/

define(
    ['./elements/ElementFactory'],
    function (ElementFactory) {
        "use strict";

        /**
         * Proxy for configuring a fixed position view via the toolbar.
         * @constructor
         * @param configuration the view configuration object to manage
         */
        function FixedProxy(configuration, $q, dialogService, callback) {
            var factory = new ElementFactory(dialogService);

            return {
                /**
                 * Add a new visual element to this view.
                 */
                add: function (type) {
                    // Place a configured element into the view configuration
                    function addElement(element) {
                        // Ensure that there is an Elements array
                        configuration.elements = configuration.elements || [];

                        // Configure common properties of the element
                        element.x = element.x || 0;
                        element.y = element.y || 0;
                        element.width = element.width || 1;
                        element.height = element.height || 1;
                        element.type = type;

                        // Finally, add it to the view's configuration
                        configuration.elements.push(element);

                        // Let the view know it needs to refresh
                        callback();
                    }

                    // Defer creation to the factory
                    $q.when(factory.createElement(type)).then(addElement);
                }
            };
        }

        return FixedProxy;
    }
);