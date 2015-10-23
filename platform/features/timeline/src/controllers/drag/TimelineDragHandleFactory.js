/*global define*/

define(
    ['./TimelineStartHandle', './TimelineEndHandle', './TimelineMoveHandle'],
    function (TimelineStartHandle, TimelineEndHandle, TimelineMoveHandle) {
        "use strict";


        var DEFAULT_HANDLES = [
                TimelineStartHandle,
                TimelineMoveHandle,
                TimelineEndHandle
            ],
            TIMELINE_HANDLES = [
                TimelineStartHandle,
                TimelineMoveHandle
            ];

        /**
         * Create a factory for drag handles for timelines/activities
         * in a timeline view.
         * @constructor
         */
        function TimelineDragHandleFactory(dragHandler, snapHandler) {
            return {
                /**
                 * Create drag handles for this domain object.
                 * @param {DomainObject} domainObject the object to be
                 *        manipulated by these gestures
                 * @returns {Array} array of drag handles
                 */
                handles: function (domainObject) {
                    var type = domainObject.getCapability('type'),
                        id = domainObject.getId();

                    // Instantiate a handle
                    function instantiate(Handle) {
                        return new Handle(
                            id,
                            dragHandler,
                            snapHandler
                        );
                    }

                    // Instantiate smaller set of handles for timelines
                    return (type && type.instanceOf('timeline') ?
                            TIMELINE_HANDLES : DEFAULT_HANDLES)
                                    .map(instantiate);
                }
            };
        }

        return TimelineDragHandleFactory;
    }
);
