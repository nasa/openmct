define([], function () {
    function SaveInProgressDialog(dialogService) {
        this.dialogService = dialogService;
    }

    SaveInProgressDialog.prototype.show = function () {
        this.dialogService.showBlockingMessage({
            title: "Saving...",
            hint: "Do not navigate away from this page or close this browser tab while this message is displayed.",
            unknownProgress: true,
            severity: "info"
        });
    };

    SaveInProgressDialog.prototype.hide = function () {
        this.dialogService.dismiss();
    };

    return SaveInProgressDialog;
});
