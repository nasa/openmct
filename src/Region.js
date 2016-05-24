define(['zepto'], function ($) {

    /**
     * A Region represents a location within the user interface where
     * views can be displayed.
     * @param {HTMLElement} container the HTML element which will contain nodes
     * @constructor
     * @memberof mct
     */
    function Region(container) {
        this.container = $(container);
    }

    /**
     * Show a view in this region.
     * @param {mct.View} view the view to show
     */
    Region.prototype.show = function (view) {
        if (this.activeView) {
            this.activeView.deactivate();
        }
        this.activeView = view;
        this.container.empty();
        if (view) {
            view.activate();
            this.container.append($(view.elements()));
        }
    };

    /**
     * Stop showing any view in this region.
     */
    Region.prototype.clear = function () {
        this.show(undefined);
    };

    return Region;
});
