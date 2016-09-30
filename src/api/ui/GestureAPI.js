define([], function () {
    /**
     * Allows support for common user actions to be attached to views.
     * @interface GestureAPI
     * @memberof module:openmct
     */
    function GestureAPI(selectGesture, contextMenuGesture) {
        this.selectGesture = selectGesture;
        this.contextMenuGesture = contextMenuGesture;
    }

    /**
     * Designate an HTML element as selectable, and associated with a
     * particular object.
     *
     * @param {HTMLElement} htmlElement the element to make selectable
     * @param {*} item the object which should become selected when this
     *        element is clicked.
     * @returns {Function} a function to remove selectability from this
     *          HTML element.
     * @method selectable
     * @memberof module:openmct.GestureAPI#
     */
    GestureAPI.prototype.selectable = function (htmlElement, item) {
        return this.selectGesture.apply(htmlElement, item);
    };


    /**
     * Designate an HTML element as having a context menu associated with
     * the provided item.
     *
     * @private
     * @param {HTMLElement} htmlElement the element to make selectable
     * @param {*} item the object for which a context menu should appear
     * @returns {Function} a function to remove this geture from this
     *          HTML element.
     * @method selectable
     * @memberof module:openmct.GestureAPI#
     */
    GestureAPI.prototype.contextMenu = function (htmlElement, item) {
        return this.contextMenuGesture.apply(htmlElement, item);
    };

    return GestureAPI;
});
