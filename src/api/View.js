define(function () {
    function View() {
    }

    /**
     * Show this view in the specified container. If this view is already
     * showing elsewhere, it will be removed from that location.
     *
     * @param {HTMLElement} container the element to populate
     */
    View.prototype.show = function (container) {
    };

    /**
     * Release any resources associated with this view.
     *
     * Subclasses should override this method to release any resources
     * they obtained during a `show` call.
     */
    View.prototype.destroy = function () {
    };

    /**
     * Check if this view is capable of showing this object. Users of
     * views should use this method before showing
     *
     * Subclasses should override this method to control the applicability
     * of this view to other objects.
     *
     * @param {*} object the value to be shown in this view
     * @returns {boolean} true if this view can display this object
     */
    View.prototype.test = function (object) {
        return false;
    };

    return View;
});
