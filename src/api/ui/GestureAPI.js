define([], function () {
    /**
     * Allows support for common user actions to be attached to views.
     * @interface GestureAPI
     * @memberof module:openmct
     */
    function GestureAPI() {

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

    };

    return GestureAPI;
});
