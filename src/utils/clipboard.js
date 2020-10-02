class Clipboard {
    constructor() {
        this.clipboardRead = false;
        this.clipboardWrite = false;

        this.init();
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

export default new Clipboard();
