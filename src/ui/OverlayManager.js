define(['zepto'], function ($) {
    function OverlayManager(bodyElement) {
        this.$body = $(bodyElement);
    }

    OverlayManager.prototype.show = function (view, x, y) {
        var $container = $('<div></div>');

        x = x || 0;
        y = y || 0;

        $container.attr('left', x + 'px');
        $container.attr('top', y + 'px');

        view.show($container[0]);

        return function () {
            $container.remove();
            view.destroy();
        };
    };

    return OverlayManager;
});
