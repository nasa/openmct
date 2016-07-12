define([
    'zepto'
], function ($) {
    function Region(element) {
        this.activeView = undefined;
        this.$element = $(element);
    }

    Region.prototype.clear = function () {
        if (this.activeView) {
            this.activeView.destroy();
            this.activeView = undefined;
        }
    };

    Region.prototype.show = function (view) {
        this.clear();
        this.activeView = view;
        if (this.activeView) {
            this.$element.append($(this.activeView.elements()));
            this.activeView.show();
        }
    };

    return Region;
});
