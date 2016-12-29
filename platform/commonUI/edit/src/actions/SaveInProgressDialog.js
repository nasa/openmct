define([], () => {
    class SaveInProgressDialog {
      constructor(dialogService) {
        this.dialogService = dialogService;
        this.dialog = undefined;
    }

    show() {
        this.dialog = this.dialogService.showBlockingMessage({
            title: "Saving...",
            hint: "Do not navigate away from this page or close this browser tab while this message is displayed.",
            unknownProgress: true,
            severity: "info",
            delay: true
        });
    }

    hide() {
        if (this.dialog) {
            this.dialog.dismiss();
        }
    }
  }
    return SaveInProgressDialog;
});
