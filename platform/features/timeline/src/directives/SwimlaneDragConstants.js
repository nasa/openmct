/*global define*/

define({
    /**
     * The string identifier for the data type used for drag-and-drop
     * composition of domain objects. (e.g. in event.dataTransfer.setData
     * calls.)
     */
    MCT_DRAG_TYPE: 'mct-domain-object-id',
    /**
     * The string identifier for the data type used for drag-and-drop
     * composition of domain objects, by object instance (passed through
     * the dndService)
     */
    MCT_EXTENDED_DRAG_TYPE: 'mct-domain-object',
    /**
     * String identifier for swimlanes being dragged.
     */
    TIMELINE_SWIMLANE_DRAG_TYPE: 'timeline-swimlane'
});
