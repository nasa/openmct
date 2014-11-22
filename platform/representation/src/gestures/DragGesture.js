/*global define,Promise*/

/**
 * Module defining DragGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {
        "use strict";

        /**
         *
         * @constructor
         */

        function DragGesture($log, element, domainObject) {
            function startDrag(e) {
                var event = (e || {}).originalEvent || e;

                $log.debug("Initiating drag");

                try {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify({
                            id: domainObject.getId(),
                            model: domainObject.getModel()
                        })
                    );
                    event.dataTransfer.setData(
                        GestureConstants.MCT_DRAG_TYPE,
                        domainObject.getId()
                    );

                } catch (err) {
                    $log.warn([
                        "Could not initiate drag due to ",
                        err.message
                    ].join(""));
                }

            }

            $log.debug("Attaching drag gesture");
            element.attr('draggable', 'true');
            element.on('dragstart', startDrag);

            return {
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