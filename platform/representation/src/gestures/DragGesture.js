/*global define,Promise*/

/**
 * Module defining DragGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {
        "use strict";

        /**
         * Add event handlers to a representation such that it may be
         * dragged as the source for drag-drop composition.
         *
         * @constructor
         * @param $log Angular's logging service
         * @param element the jqLite-wrapped element which should become
         *        draggable
         * @param {DomainObject} domainObject the domain object which
         *        is represented; this will be passed on drop.
         */
        function DragGesture($log, dndService, element, domainObject) {
            function startDrag(e) {
                var event = (e || {}).originalEvent || e;

                $log.debug("Initiating drag");

                try {
                    // Set the data associated with the drag-drop operation
                    event.dataTransfer.effectAllowed = 'move';

                    // Support drop as plain-text (JSON); not used internally
                    event.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify({
                            id: domainObject.getId(),
                            model: domainObject.getModel()
                        })
                    );

                    // For internal use, pass the object's identifier as
                    // part of the drag
                    event.dataTransfer.setData(
                        GestureConstants.MCT_DRAG_TYPE,
                        domainObject.getId()
                    );

                    // Finally, also pass the id object instance via the
                    // dndService, allowing inspection during drag as well
                    // as retrieval of the original domain object.
                    dndService.setData(
                        GestureConstants.MCT_EXTENDED_DRAG_TYPE,
                        domainObject
                    );
                    dndService.setData(
                        GestureConstants.MCT_DRAG_TYPE,
                        domainObject.getId()
                    );


                } catch (err) {
                    // Exceptions at this point indicate that the browser
                    // do not fully support drag-and-drop (e.g. if
                    // dataTransfer is undefined)
                    $log.warn([
                        "Could not initiate drag due to ",
                        err.message
                    ].join(""));
                }

            }

            function endDrag() {
                // Clear the drag data after the drag is complete
                dndService.removeData(GestureConstants.MCT_DRAG_TYPE);
                dndService.removeData(GestureConstants.MCT_EXTENDED_DRAG_TYPE);
            }

            // Mark the element as draggable, and handle the dragstart event
            $log.debug("Attaching drag gesture");
            element.attr('draggable', 'true');
            element.on('dragstart', startDrag);
            element.on('dragend', endDrag);

            return {
                /**
                 * Detach any event handlers associated with this gesture.
                 * @memberof DragGesture
                 * @method
                 */
                destroy: function () {
                    // Detach listener
                    element.removeAttr('draggable');
                    element.off('dragstart', startDrag);
                }
            };
        }


        return DragGesture;
    }
);