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
                    window.alert("Placeholder. Should add a " + type + ".");
                }
            };
        }

        return FixedProxy;
    }
);