define(['text!./dialog.html', 'zepto'], function (dialogTemplate, $) {
    function Dialog(view, title) {
        this.view = view;
        this.title = title;
        this.showing = false;
        this.enabledState = true;
    }

    Dialog.prototype.show = function () {
        if (this.showing) {
            throw new Error("Dialog already showing.");
        }

        var $body = $('body');
        var $dialog = $(dialogTemplate);
        var $contents = $dialog.find('.contents .editor');
        var $close = $dialog.find('.close');

        var $ok = $dialog.find('.ok');
        var $cancel = $dialog.find('.cancel');

        if (this.title) {
            $dialog.find('.title').text(this.title);
        }

        $body.append($dialog);
        this.view.show($contents[0]);
        this.$dialog = $dialog;
        this.$ok = $ok;
        this.showing = true;

        [$ok, $cancel, $close].forEach(function ($button) {
            $button.on('click', this.hide.bind(this));
        }.bind(this));

        return new Promise(function (resolve, reject) {
            $ok.on('click', resolve);
            $cancel.on('click', reject);
            $close.on('click', reject);
        });
    };

    Dialog.prototype.hide = function () {
        if (!this.showing) {
            return;
        }
        this.$dialog.remove();
        this.view.destroy();
        this.showing = false;
    };

    Dialog.prototype.enabled = function (state) {
        if (state !== undefined) {
            this.enabledState = state;
            if (this.showing) {
                this.$ok.toggleClass('disabled', !state);
            }
        }
        return this.enabledState;
    };

    return Dialog;
});
