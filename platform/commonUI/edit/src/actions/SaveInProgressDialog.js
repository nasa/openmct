define([], function () {
    var self = this;

    function SaveInProgressDialog(dialogService, $timeout) {
        self.dialogService = dialogService;
        self.$timeout = $timeout;

        self.dialog = undefined;
        self.timeoutId = undefined;
    }

    SaveInProgressDialog.prototype.show = function () {
        clearTimeout(self.timeoutId);
        self.timeoutId = self.$timeout(function () {
            self.dialog = self.dialogService.showBlockingMessage({
                title: "Saving...",
                hint: "Do not navigate away from this page or close this browser tab while this message is displayed.",
                unknownProgress: true,
                severity: "info"
            });
        }, 100);
    };

    SaveInProgressDialog.prototype.hide = function () {
        self.$timeout.cancel(self.timeoutId);
        if (self.dialog) {
            self.dialog.dismiss();
        }
    };

    return SaveInProgressDialog;
});
