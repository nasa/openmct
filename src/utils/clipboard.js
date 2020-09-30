function getClipboard() {
    if (Clipboard.instance) {
        return Clipboard.instance;
    }

    new Clipboard();

    return Clipboard.instance;
}

class Clipboard {
    constructor() {
        if (Clipboard.instance) {
            return;
        }

        this.clipboardRead = false;
        this.clipboardWrite = false;

        this.init();

        Clipboard.instance = this;
    }

    init() {
        navigator.permissions.query({ name: 'clipboard-write' })
            .then(result => {
                if (result.state == 'granted' || result.state == 'prompt') {
                    this.clipboardWrite = true;
                }
            });

        navigator.permissions.query({ name: 'clipboard-read' })
            .then(result => {
                if (result.state == 'granted' || result.state == 'prompt') {
                    this.clipboardRead = true;
                }
            });
    }

    updateClipboard(newClip) {
        if (!this.clipboardWrite) {
            return Promise.reject('Error: No permission to write clipboard');
        }

        // return promise
        return navigator.clipboard.writeText(newClip);
    }

    readClipboard() {
        if (!this.clipboardRead) {
            return Promise.reject('Error: No permission to read clipboard');
        }

        // return promise
        return navigator.clipboard.readText();
    }
}

export default getClipboard();

