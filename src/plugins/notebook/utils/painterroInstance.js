/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import Painterro from 'painterro';

import { getThumbnailURLFromImageUrl } from './notebook-image.js';

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

  initialize() {
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
        const thumbnailURL = await getThumbnailURLFromImageUrl(fullSizeImageURL);
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
