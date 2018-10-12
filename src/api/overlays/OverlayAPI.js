import Overlay from './Overlay';
import Dialog from './Dialog';

class OverlayAPI {
    constructor() {
        this.activeOverlays = [];
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

    progressDialog() {

    }

}

export default OverlayAPI;
