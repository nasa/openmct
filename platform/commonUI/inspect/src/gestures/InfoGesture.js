/*global define*/

define(
    [],
    function () {
        "use strict";

        function InfoGesture(infoService, element, domainObject) {
            var dismissBubble;

            function hideBubble() {
                if (dismissBubble) {
                    dismissBubble();
                    element.off('mouseleave', hideBubble);
                    dismissBubble = undefined;
                }
            }

            function showBubble(event) {
                dismissBubble = infoService.display(
                    "info-table",
                    domainObject.getName(),
                    [
                        { name: "ID", value: domainObject.getId() }
                    ],
                    [ event.clientX, event.clientY ]
                );
                element.on('mouseleave', hideBubble);
            }

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