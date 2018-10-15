import Overlay from './Overlay';
import Dialog from './Dialog';
import ProgressDialog from './ProgressDialog';

class OverlayAPI {
    constructor() {
        this.activeOverlays = [];
        window.exampleDialog = this.exampleDialog.bind(this);
    }

    showOverlay(overlay) {
        if (this.activeOverlays.length) {
            this.activeOverlays[this.activeOverlays.length - 1].container.classList.add('invisible');
        }

        this.activeOverlays.push(overlay);

        overlay.once('destroy', () => {
            this.activeOverlays.splice(this.activeOverlays.indexOf(overlay), 1);

            if (this.activeOverlays.length) {
                this.activeOverlays[this.activeOverlays.length - 1].container.classList.remove('invisible');
            }
        });

        overlay.show();
    }

    overlay(options) {
        let overlay = new Overlay(options);

        this.showOverlay(overlay);

        return overlay;
    }

    dialog(options) {
        let dialog = new Dialog(options);

        this.showOverlay(dialog);

        return dialog;
    }

    progressDialog(options) {
        let progressDialog = new ProgressDialog(options);

        this.showOverlay(progressDialog);

        return progressDialog;
    }

    exampleDialog(options) {
        var dialog;
        options = options || {
            progressText: 'Hello World',
            progressPerc: '40',
            buttons: [
                {
                    label: 'Dismiss',
                    callback: function () {
                        dialog.dismiss();
                    }
                }
            ]
        };

        dialog = this.progressDialog(options);
        return dialog;
    }

}

export default OverlayAPI;
