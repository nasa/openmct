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
    }

    /**
     * Display this dialog.
     * @returns {Promise} a promise that will be resolved if the user
     *          chooses "OK", an rejected if the user chooses "cancel"
     * @method show
     * @memberof module:openmct.Dialog#
     */
    Dialog.prototype.show = function () {
        var $body = $('body');
        var $dialog = $(dialogTemplate);
        var $contents = $dialog.find('.contents .editor');
        var $close = $dialog.find('.close');

        var $ok = $dialog.find('.ok');
        var $cancel = $dialog.find('.cancel');

        var view = this.view;

        function dismiss() {
            $dialog.remove();
            view.destroy();
        }

        if (this.title) {
            $dialog.find('.title').text(this.title);
        }

        $body.append($dialog);
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
