define([], function () {
    function SaveInProgressDialog(dialogService) {
        this.dialogService = dialogService;
        this.dialog = undefined;
    }

    SaveInProgressDialog.prototype.show = function () {
        this.dialog = this.dialogService.showBlockingMessage({
            title: "Saving...",
            hint: "Do not navigate away from this page or close this browser tab while this message is displayed.",
            unknownProgress: true,
            severity: "info"
        });
    };

    SaveInProgressDialog.prototype.hide = function () {
        if (this.dialog) {
            this.dialog.dismiss();
        }
    };

    return SaveInProgressDialog;
});
