/*global define*/

define(
    [],
    function () {
        "use strict";

        function InfoGesture($timeout, infoService, DELAY, element, domainObject) {
            var dismissBubble,
                pendingBubble,
                mousePosition;

            function hideBubble() {
                if (dismissBubble) {
                    dismissBubble();
                    element.off('mouseleave', hideBubble);
                    dismissBubble = undefined;
                }
                if (pendingBubble) {
                    $timeout.cancel(pendingBubble);
                    pendingBubble = undefined;
                }
                mousePosition = undefined;
            }

            function trackPosition(event) {
                mousePosition = [ event.clientX, event.clientY ];
            }

            function showBubble(event) {
                trackPosition(event);

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

            element.on('mousemove', trackPosition);
            element.on('mouseenter', showBubble);

            return {
                destroy: function () {
                    hideBubble();
                    element.off('mouseenter', showBubble);
                }
            };
        }

        return InfoGesture;

    }

);