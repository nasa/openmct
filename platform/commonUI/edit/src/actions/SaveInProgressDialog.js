define([], function () {
    function SaveInProgressDialog(dialogService, $timeout) {
        this.dialogService = dialogService;
        this.$timeout = $timeout;

        this.dialog = undefined;
        this.timeoutId = undefined;
    }

    SaveInProgressDialog.prototype.show = function () {
        var self = this;

        self.$timeout.cancel(self.timeoutId);
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
        this.$timeout.cancel(this.timeoutId);
        if (this.dialog) {
            this.dialog.dismiss();
        }
    };

    return SaveInProgressDialog;
});
