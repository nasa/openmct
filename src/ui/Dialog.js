define(['text!./dialog.html', 'zepto'], function (overlayTemplate, $) {
    function Dialog(view) {
        this.view = view;
    }

    Dialog.prototype.show = function () {
        var $body = $('body');
        var $overlay = $(overlayTemplate);
        var $contents = $overlay.find('.contents .editor');
        var $close = $overlay.find('.close');

        var $ok = $overlay.find('.ok');
        var $cancel = $overlay.find('.cancel');

        var view = this.view;

        function dismiss() {
            $overlay.remove();
            view.destroy();
        }

        $body.append($overlay);
        this.view.show($contents[0]);

        return new Promise(function (resolve, reject) {
            $ok.on('click', resolve);
            $ok.on('click', dismiss);

            $cancel.on('click', reject);
            $cancel.on('click', dismiss);

            $close.on('click', reject);
            $close.on('click', dismiss);
        });
    };

    return Dialog;
});
