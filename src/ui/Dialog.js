define(['text!./overlay.html', 'zepto'], function (overlayTemplate, $) {
    function Dialog(view) {
        this.view = view;
    }

    Dialog.prototype.show = function () {
        var $body = $('body');
        var $overlay = $(overlayTemplate);
        var $contents = $overlay.find('.contents');
        var $close = $overlay.find('.close');

        $body.append($overlay);
        $close.on('click', function () {
            $overlay.remove();
            this.view.destroy();
        }.bind(this));

        this.view.show($contents[0]);
    };

    return Dialog;
});
