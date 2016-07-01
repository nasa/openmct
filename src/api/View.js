define(function () {
    function View() {
    }

    /**
     * Show this view in the specified container. If this view is already
     * showing elsewhere, it will be removed from that location.
     *
     * @param {HTMLElement} container the element to populate
     * @param {*} object the object to be shown in this view
     * @returns {Function} a function to call to release any resources
     *          associated with this view
     */
    View.prototype.show = function (container, object) {
        return function () {};
    };

    /**
     * Check if this view is capable of showing this object. Users of
     * views should use this method before calling `show`.
     *
     * Subclasses should override this method to control the applicability
     * of this view to other objects.
     *
     * @param {*} object the object to be shown in this view
     * @returns {boolean} true if this view can display this object
     */
    View.prototype.test = function (object) {
        return false;
    };

    return View;
});
