/*global define*/

define(
    [],
    function () {
        'use strict';

        /**
         * Implements `mct-scroll-x` and `mct-scroll-y` directives. Listens
         * for scroll events and publishes their results into scope; watches
         * scope and updates scroll state to match. This varies for x- and y-
         * directives only by the attribute name chosen to find the expression,
         * and the property (scrollLeft or scrollTop) managed within the
         * element.
         *
         * This is exposed as two directives in `bundle.json`; the difference
         * is handled purely by parameterization.
         *
         * @constructor
         * @param $parse Angular's $parse
         * @param {string} property property to manage within the HTML element
         * @param {string} attribute attribute to look at for the assignable
         *        Angular expression
         */
        function MCTScroll($parse, property, attribute) {
            function link(scope, element, attrs) {
                var expr = attrs[attribute],
                    parsed = $parse(expr);

                // Set the element's scroll to match the scope's state
                function updateElement(value) {
                    element[0][property] = value;
                }

                // Handle event; assign to scroll state to scope
                function updateScope() {
                    parsed.assign(scope, element[0][property]);
                    scope.$apply(expr);
                }

                // Initialize state in scope
                updateScope();

                // Update element state when value in scope changes
                scope.$watch(expr, updateElement);

                // Update state in scope when element is scrolled
                element.on('scroll', updateScope);
            }

            return {
                // Restrict to attributes
                restrict: "A",
                // Use this link function
                link: link
            };
        }

        return MCTScroll;

    }
);