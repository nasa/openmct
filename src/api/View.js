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

    return View;
});
