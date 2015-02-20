/*global define*/

define(
    ['./ElementProxy'],
    function (ElementProxy) {
        'use strict';

        /**
         *
         */
        function LineProxy(element, index, elements) {
            var proxy = new ElementProxy(element, index, elements);

            proxy.x = function (v) {
                var x = Math.min(element.x, element.x2),
                    delta = v - x;
                if (arguments.length > 0 && delta) {
                    element.x += delta;
                    element.x2 += delta;
                }
                return x;
            };

            proxy.y = function (v) {
                var y = Math.min(element.y, element.y2),
                    delta = v - y;
                if (arguments.length > 0 && delta) {
                    element.y += delta;
                    element.y2 += delta;
                }
                return y;
            };

            proxy.width = function () {
                return Math.max(element.x, element.x2) - proxy.x();
            };

            proxy.height = function () {
                return Math.max(element.y, element.y2) - proxy.y();
            };

            proxy.x1 = function () {
                return element.x - proxy.x();
            };

            proxy.y1 = function () {
                return element.y - proxy.y();
            };

            proxy.x2 = function () {
                return element.x2 - proxy.x();
            };

            proxy.y2 = function () {
                return element.y2 - proxy.y();
            };

            return proxy;
        }

        return LineProxy;
    }
);