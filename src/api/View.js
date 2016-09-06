define([], function () {

    /**
     * A View is used to provide displayable content, and to react to
     * associated life cycle events.
     *
     * @interface
     * @memberof module:openmct
     */
    function View() {

    }

    /**
     * Populate the supplied DOM element with the contents of this view.
     *
     * View implementations should use this method to attach any
     * listeners or acquire other resources that are necessary to keep
     * the contents of this view up-to-date.
     *
     * @param {HTMLElement} container the DOM element to populate
     * @method show
     * @memberof module:openmct.View#
     */
    View.prototype.show = function (container) {

    };

    /**
     * Release any resources associated with this view.
     *
     * View implementations should use this method to detach any
     * listeners or release other resources that are no longer necessary
     * once a view is no longer used.
     *
     * @method destroy
     * @memberof module:openmct.View#
     */
    View.prototype.destroy = function () {

    };

    return View;
});
