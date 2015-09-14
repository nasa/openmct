/*global define*/

define(
    ['../../TimelineConstants'],
    function (Constants) {
        "use strict";

        /**
         * Handle for changing the end time of a timeline or
         * activity in the Timeline view.
         * @constructor
         * @param {string} id identifier of the domain object
         * @param {TimelineDragHandler} dragHandler the handler which
         *        will update object state
         * @param {TimelineSnapHandler} snapHandler the handler which
         *        provides candidate snap-to locations.
         */
        function TimelineEndHandle(id, dragHandler, snapHandler) {
            var initialEnd;

            // Get the snap-to location for a timestamp
            function snap(timestamp, zoom) {
                return snapHandler.snap(
                    timestamp,
                    zoom.toMillis(Constants.SNAP_WIDTH),
                    id
                );
            }

            return {
                /**
                 * Start dragging this handle.
                 */
                begin: function () {
                    // Cache the initial state
                    initialEnd = dragHandler.end(id);
                },
                /**
                 * Drag this handle.
                 * @param {number} delta pixel delta from start
                 * @param {TimelineZoomController} zoom provider of zoom state
                 */
                drag: function (delta, zoom) {
                    if (initialEnd !== undefined) {
                        // Update the state
                        dragHandler.end(
                            id,
                            snap(initialEnd + zoom.toMillis(delta), zoom)
                        );
                    }
                },
                /**
                 * Finish dragging this handle.
                 */
                finish: function () {
                    // Clear initial state
                    initialEnd = undefined;
                    // Persist changes
                    dragHandler.persist();
                },
                /**
                 * Get a style object (suitable for passing into `ng-style`)
                 * for this handle.
                 * @param {TimelineZoomController} zoom provider of zoom state
                 */
                style: function (zoom) {
                    return {
                        left: zoom.toPixels(dragHandler.end(id)) - Constants.HANDLE_WIDTH + 'px',
                        width: Constants.HANDLE_WIDTH + 'px'
                    };
                }
            };
        }

        return TimelineEndHandle;
    }
);