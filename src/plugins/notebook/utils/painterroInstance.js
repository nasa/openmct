import Painterro from 'painterro';

const DEFAULT_CONFIG = {
    activeColor: '#ff0000',
    activeColorAlpha: 1.0,
    activeFillColor: '#fff',
    activeFillColorAlpha: 0.0,
    backgroundFillColor: '#000',
    backgroundFillColorAlpha: 0.0,
    defaultFontSize: 16,
    defaultLineWidth: 2,
    defaultTool: 'ellipse',
    hiddenTools: ['save', 'open', 'close', 'eraser', 'pixelize', 'rotate', 'settings', 'resize'],
    translation: {
        name: 'en',
        strings: {
            lineColor: 'Line',
            fillColor: 'Fill',
            lineWidth: 'Size',
            textColor: 'Color',
            fontSize: 'Size',
            fontStyle: 'Style'
        }
    }
};

export default class PainterroInstance {
    constructor(element, saveCallback) {
        this.elementId = element.id;
        this.isSave = false;
        this.painterroInstance = null;
        this.saveCallback = saveCallback;
    }

    dismiss() {
        this.isSave = false;
        this.painterroInstance.save();
    }

    intialize() {
        this.config = Object.assign({}, DEFAULT_CONFIG);

        this.config.id = this.elementId;
        this.config.saveHandler = this.saveHandler.bind(this);

        this.painterro = Painterro(this.config);
    }

    save() {
        this.isSave = true;
        this.painterroInstance.save();
    }

    saveHandler(image, done) {
        if (this.isSave) {
            const self = this;
            const url = image.asBlob();
            const reader = new window.FileReader();
            reader.readAsDataURL(url);
            reader.onloadend = () => {
                const snapshot = reader.result;
                const snapshotObject = {
                    src: snapshot,
                    type: url.type,
                    size: url.size,
                    modified: Date.now()
                };

                self.saveCallback(snapshotObject);
            };
        }

        done(true);
    }

    show(src) {
        this.painterroInstance = this.painterro.show(src);
    }
}
