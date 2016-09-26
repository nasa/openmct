define(['zepto'], function ($) {

    function OverlayManager(bodyElement) {
        this.$body = $(bodyElement);
    }

    OverlayManager.prototype.show = function (view, x, y) {
        var $container = $('<div></div>');
        var w = this.$body.width();
        var h = this.$body.height();

        x = x || 0;
        y = y || 0;

        $container.css('position', 'absolute');

        if (x < w / 2) {
            $container.css('left', x + 'px');
        } else {
            $container.css('right', (w - x) + 'px');
        }

        if (x < h / 2) {
            $container.css('top', y + 'px');
        } else {
            $container.css('bottom', (h - y) + 'px');
        }

        view.show($container[0]);

        this.$body.prepend($container);

        return function () {
            $container.remove();
            view.destroy();
        };
    };

    return OverlayManager;
});
