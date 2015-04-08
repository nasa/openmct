/*global define,Promise*/

/**
 * Module defining DropGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {
        "use strict";

        /**
         * A DropGesture adds and maintains event handlers upon an element
         * such that it may act as a drop target for drag-drop composition.

         * @constructor
         * @param $q Angular's $q, for promise handling
         * @param element the jqLite-wrapped representation element
         * @param {DomainObject} domainObject the domain object whose
         *        composition should be modified as a result of the drop.
         */

        function DropGesture(dndService, $q, element, domainObject) {
            var actionCapability = domainObject.getCapability('action'),
                action; // Action for the drop, when it occurs

            function broadcastDrop(id, event) {
                // Find the relevant scope...
                var scope = element && element.scope && element.scope(),
                    rect;
                if (scope && scope.$broadcast) {
                    // Get the representation's bounds, to convert
                    // drop position
                    rect = element[0].getBoundingClientRect();

                    // ...and broadcast the event. This allows specific
                    // views to have post-drop behavior which depends on
                    // drop position.
                    scope.$broadcast(
                        GestureConstants.MCT_DROP_EVENT,
                        id,
                        {
                            x: event.pageX - rect.left,
                            y: event.pageY - rect.top
                        }
                    );
                }
            }

            function dragOver(e) {
                var event = (e || {}).originalEvent || e,
                    selectedObject = dndService.getData(
                        GestureConstants.MCT_EXTENDED_DRAG_TYPE
                    );

                if (selectedObject) {
                    // TODO: Vary this based on modifier keys
                    action = actionCapability.getActions({
                        key: 'link',
                        selectedObject: selectedObject
                    })[0];

                    if (action) {
                        event.dataTransfer.dropEffect = 'move';

                        // Indicate that we will accept the drag
                        event.preventDefault(); // Required in Chrome?
                        return false;
                    }
                }
            }

            function drop(e) {
                var event = (e || {}).originalEvent || e,
                    id = event.dataTransfer.getData(GestureConstants.MCT_DRAG_TYPE);

                // Handle the drop; add the dropped identifier to the
                // destination domain object's composition, and persist
                // the change.
                if (id) {
                    $q.when(action && action.perform()).then(function (result) {
                        // Broadcast the drop event if it was successful
                        if (result) {
                            broadcastDrop(id, event);
                        }
                    });
                }

            }

            // We can only handle drops if we have access to actions...
            if (actionCapability) {
                // Listen for dragover,  to indicate we'll accept a drag
                element.on('dragover', dragOver);

                // Listen for the drop itself
                element.on('drop', drop);
            }

            return {
                /**
                 * Detach any event handlers associated with this gesture.
                 */
                destroy: function () {
                    element.off('dragover', dragOver);
                    element.off('drop', drop);
                }
            };

        }


        return DropGesture;
    }
);