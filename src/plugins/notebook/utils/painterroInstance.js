import Painterro from 'painterro';

const defaultConfig = {
    id: 'snap-annotation',
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
    constructor() {
        this.callback = null;
        this.config = Object.assign({}, defaultConfig);
        this.config.id = this.config.id;
        this.config.saveHandler = this.saveHandler.bind(this);
        this.isSave = false;

        this.painterro = Painterro(this.config);
        this.painterroInstance = null;
    }

    dismiss() {
        this.isSave = false;
        this.painterroInstance.save();
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

                self.callback(snapshotObject);
            };
        }

        done(true);
    }

    show(src) {
        this.painterroInstance = this.painterro.show(src);
    }
}
