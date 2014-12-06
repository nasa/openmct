/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The GestureRepresenter is responsible for installing predefined
         * gestures upon mct-representation instances.
         * Gestures themselves are pulled from the gesture service; this
         * simply wraps that behavior in a Representer interface, such that
         * it may be included among other such Representers used to prepare
         * specific representations.
         * @param {GestureService} gestureService the service which provides
         *        gestures
         * @param {Scope} scope the Angular scope for this representation
         * @param element the JQLite-wrapped mct-representation element
         */
        function GestureRepresenter(gestureService, scope, element) {
            var gestureHandle;

            function destroy() {
                // Release any resources associated with these gestures
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
                /**
                 * Set the current representation in use, and the domain
                 * object being represented.
                 *
                 * @param {RepresentationDefinition} representation the
                 *        definition of the representation in use
                 * @param {DomainObject} domainObject the domain object
                 *        being represented
                 */
                represent: represent,
                /**
                 * Release any resources associated with this representer.
                 */
                destroy: destroy
            };
        }

        return GestureRepresenter;
    }
);