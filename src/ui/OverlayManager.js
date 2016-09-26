define(['zepto'], function ($) {

    function OverlayManager(bodyElement) {
        this.$body = $(bodyElement);
    }

    OverlayManager.prototype.show = function (view, x, y) {
        var $container = $('<div></div>');

        x = x || 0;
        y = y || 0;

        $container.css('position', 'absolute');
        $container.css('left', x + 'px');
        $container.css('top', y + 'px');

        view.show($container[0]);

        this.$body.prepend($container);

        return function () {
            $container.remove();
            view.destroy();
        };
    };

    return OverlayManager;
});
