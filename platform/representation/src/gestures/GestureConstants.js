/*global define,Promise*/

/**
 * Module defining GestureConstants. Created by vwoeltje on 11/17/14.
 */
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
     * An estimate for the dimensions of a context menu, used for
     * positioning.
     */
    MCT_MENU_DIMENSIONS: [ 170, 200 ],
    /**
     * Identifier for drop events.
     */
    MCT_DROP_EVENT: 'mctDrop'
});