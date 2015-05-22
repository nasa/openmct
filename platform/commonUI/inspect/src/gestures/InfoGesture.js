/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The `info` gesture displays domain object metadata in a
         * bubble on hover.
         *
         * @constructor
         * @param $timeout Angular's `$timeout`
         * @param {InfoService} infoService a service which shows info bubbles
         * @param {number} DELAY delay, in milliseconds, before bubble appears
         * @param element jqLite-wrapped DOM element
         * @param {DomainObject} domainObject the domain object for which to
         *        show information
         */
        function InfoGesture($timeout, infoService, DELAY, element, domainObject) {
            var dismissBubble,
                pendingBubble,
                mousePosition,
                scopeOff;

            function hideBubble() {
                // If a bubble is showing, dismiss it
                if (dismissBubble) {
                    dismissBubble();
                    element.off('mouseleave', hideBubble);
                    dismissBubble = undefined;
                }
                // If a bubble will be shown on a timeout, cancel that
                if (pendingBubble) {
                    $timeout.cancel(pendingBubble);
                    pendingBubble = undefined;
                }
                // Also clear mouse position so we don't have a ton of tiny
                // arrays allocated while user mouses over things
                mousePosition = undefined;
            }

            function trackPosition(event) {
                // Record mouse position, so bubble can be shown at latest
                // mouse position (not just where the mouse entered)
                mousePosition = [ event.clientX, event.clientY ];
            }

            function showBubble(event) {
                trackPosition(event);

                // Show the bubble, after a suitable delay (if mouse has
                // left before this time is up, this will be canceled.)
                pendingBubble = $timeout(function () {
                    dismissBubble = infoService.display(
                        "info-table",
                        domainObject.getModel().name,
                        [
                            { name: "ID", value: domainObject.getId() }
                        ],
                        mousePosition
                    );
                    pendingBubble = undefined;
                }, DELAY);

                element.on('mouseleave', hideBubble);
            }

            // Show bubble (on a timeout) on mouse over
            element.on('mouseenter', showBubble);

            // Also need to track position during hover
            element.on('mousemove', trackPosition);

            // Also make sure we dismiss bubble if representation is destroyed
            // before the mouse actually leaves it
            scopeOff = element.scope().$on('$destroy', hideBubble);

            return {
                /**
                 * Detach any event handlers associated with this gesture.
                 * @memberof InfoGesture
                 * @method
                 */
                destroy: function () {
                    // Dismiss any active bubble...
                    hideBubble();
                    // ...and detach listeners
                    element.off('mouseenter', showBubble);
                    scopeOff();
                }
            };
        }

        return InfoGesture;

    }

);