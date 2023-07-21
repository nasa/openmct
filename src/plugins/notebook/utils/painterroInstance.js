import Painterro from 'painterro';
import { getThumbnailURLFromimageUrl } from './notebook-image';

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
  constructor(element, openmct) {
    this.elementId = element.id;
    this.isSave = false;
    this.painterroInstance = undefined;
    this.saveCallback = undefined;
    this.openmct = openmct;
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

  save(callback) {
    this.saveCallback = callback;
    this.isSave = true;
    this.painterroInstance.save();
  }

  saveHandler(image, done) {
    if (this.isSave) {
      const url = image.asBlob();

      const reader = new window.FileReader();
      reader.readAsDataURL(url);
      reader.onloadend = async () => {
        const fullSizeImageURL = reader.result;
        const thumbnailURL = await getThumbnailURLFromimageUrl(fullSizeImageURL);
        const snapshotObject = {
          fullSizeImage: {
            src: fullSizeImageURL,
            type: url.type,
            size: url.size,
            modified: this.openmct.time.now()
          },
          thumbnailImage: {
            src: thumbnailURL,
            modified: this.openmct.time.now()
          }
        };

        this.saveCallback(snapshotObject);

        done(true);
      };
    } else {
      done(true);
    }
  }

  show(src) {
    this.painterroInstance = this.painterro.show(src);
  }
}
