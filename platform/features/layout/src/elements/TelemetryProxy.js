/*global define*/

define(
    ['./ElementProxy'],
    function (ElementProxy) {
        'use strict';

        /**
         *
         */
        function TelemetryProxy(element, index, elements) {
            var proxy = new ElementProxy(element, index, elements);

            proxy.id = element.id;

            return proxy;
        }

        return TelemetryProxy;
    }
);