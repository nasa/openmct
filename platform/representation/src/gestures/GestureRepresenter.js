/*global define*/

define(
    [],
    function () {
        "use strict";

        function GestureRepresenter(gestureService, scope, element) {
            var gestureHandle;

            function destroy() {
                if (gestureHandle) {
                    gestureHandle.destroy();
                }
            }

            function represent(representation, domainObject) {
                // Clear out any existing gestures
                destroy();

                // Attach gestures - by way of the service.
                gestureHandle = gestureService.attachGestures(
                    element,
                    domainObject,
                    (representation || {}).gestures || []
                );
            }

            return {
                represent: represent,
                destroy: destroy
            };
        }

        return GestureRepresenter;
    }
);