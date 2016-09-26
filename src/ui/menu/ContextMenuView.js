define(['zepto'], function ($) {
    function ContextMenuView(actions) {
        this.actions = actions;
    }

    ContextMenuView.prototype.show = function (element) {
        var $els = $('<span>Hello context menu!</span>');
        $(element).append($els);
    };

    ContextMenuView.prototype.destroy = function () {

    };

    return ContextMenuView;
});
