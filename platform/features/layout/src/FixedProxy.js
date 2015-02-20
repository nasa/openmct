/*global define,window*/

define(
    ['./elements/ElementFactory'],
    function (ElementFactory) {
        "use strict";

        /**
         * Proxy for configuring a fixed position view via the toolbar.
         * @constructor
         * @param {Function} addElementCallback callback to invoke when
         *        elements are created
         * @param $q Angular's $q, for promise-handling
         * @param {DialogService} dialogService dialog service to use
         *        when adding a new element will require user input
         */
        function FixedProxy(addElementCallback, $q, dialogService) {
            var factory = new ElementFactory(dialogService);

            return {
                /**
                 * Add a new visual element to this view.
                 */
                add: function (type) {
                    // Place a configured element into the view configuration
                    function addElement(element) {
                        // Configure common properties of the element
                        element.x = element.x || 0;
                        element.y = element.y || 0;
                        element.width = element.width || 1;
                        element.height = element.height || 1;
                        element.type = type;

                        // Finally, add it to the view's configuration
                        addElementCallback(element);
                    }

                    // Defer creation to the factory
                    $q.when(factory.createElement(type)).then(addElement);
                }
            };
        }

        return FixedProxy;
    }
);