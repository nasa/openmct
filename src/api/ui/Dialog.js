define(['text!./dialog.html', 'zepto'], function (dialogTemplate, $) {

    /**
     * A dialog may be displayed to show blocking content to users.
     * @param {module:openmct.View} view the view to show in the dialog
     * @param {string [title] the title for this dialog
     * @constructor
     * @memberof module:openmct
     */
    function Dialog(view, title) {
        this.view = view;
        this.title = title;
        this.showing = false;
        this.enabledState = true;
    }

    /**
     * Display this dialog.
     * @returns {Promise} a promise that will be resolved if the user
     *          chooses "OK", an rejected if the user chooses "cancel"
     * @method show
     * @memberof module:openmct.Dialog#
     */
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
