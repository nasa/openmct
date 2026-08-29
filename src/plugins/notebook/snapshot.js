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
import { NOTEBOOK_DEFAULT } from '@/plugins/notebook/notebook-constants';

import ImageExporter from '../../exporters/ImageExporter.js';
import SnapshotContainer from './snapshot-container.js';
import { addNotebookEntry, createNewEmbed } from './utils/notebook-entries.js';
import {
  createNotebookImageDomainObject,
  DEFAULT_SIZE,
  saveNotebookImageDomainObject,
  updateNamespaceOfDomainObject
} from './utils/notebook-image.js';
import {
  getDefaultNotebook,
  getDefaultNotebookLink,
  getNotebookSectionAndPage,
  setDefaultNotebook
} from './utils/notebook-storage.js';

export default class Snapshot {
  constructor(openmct) {
    this.openmct = openmct;
    this.snapshotContainer = new SnapshotContainer(openmct);
    this.imageExporter = new ImageExporter(openmct);

    this.capture = this.capture.bind(this);
    this._saveSnapShot = this._saveSnapShot.bind(this);
  }

  capture(snapshotMeta, notebookType, domElement) {
    const options = {
      className: 's-status-taking-snapshot',
      thumbnailSize: DEFAULT_SIZE
    };
    this.imageExporter.exportPNGtoSRC(domElement, options).then(
      function ({ blob, thumbnail }) {
        const reader = new window.FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
          this._saveSnapShot(notebookType, reader.result, thumbnail, snapshotMeta);
        }.bind(this);
      }.bind(this)
    );
  }

  /**
   * @private
   */
  _saveSnapShot(notebookType, fullSizeImageURL, thumbnailImageURL, snapshotMeta) {
    const object = createNotebookImageDomainObject(fullSizeImageURL);
    const thumbnailImage = { src: thumbnailImageURL || '' };
    const snapshot = {
      fullSizeImageObjectIdentifier: object.identifier,
      thumbnailImage
    };
    createNewEmbed(snapshotMeta, snapshot).then((embed) => {
      if (notebookType === NOTEBOOK_DEFAULT) {
        const notebookStorage = getDefaultNotebook();

        this._saveToDefaultNoteBook(notebookStorage, embed);
        const notebookImageDomainObject = updateNamespaceOfDomainObject(
          object,
          notebookStorage.identifier.namespace
        );
        saveNotebookImageDomainObject(this.openmct, notebookImageDomainObject);
      } else {
        this._saveToNotebookSnapshots(object, embed);
      }
    });
  }

  /**
   * @private
   */
  _saveToDefaultNoteBook(notebookStorage, embed) {
    this.openmct.objects.get(notebookStorage.identifier).then((domainObject) => {
      return addNotebookEntry(this.openmct, domainObject, notebookStorage, embed).then(async () => {
        let link = notebookStorage.link;

        // Backwards compatibility fix (old notebook model without link)
        if (!link) {
          link = await getDefaultNotebookLink(this.openmct, domainObject);
          notebookStorage.link = link;
          setDefaultNotebook(this.openmct, notebookStorage);
        }

        const { section, page } = getNotebookSectionAndPage(
          domainObject,
          notebookStorage.defaultSectionId,
          notebookStorage.defaultPageId
        );
        if (!section || !page) {
          return;
        }

        const defaultPath = `${domainObject.name} - ${section.name} - ${page.name}`;
        const msg = `Saved to Notebook ${defaultPath}`;
        this._showNotification(msg, link);
      });
    });
  }

  /**
   * @private
   */
  _saveToNotebookSnapshots(notebookImageDomainObject, embed) {
    this.snapshotContainer.addSnapshot(notebookImageDomainObject, embed);
  }

  _showNotification(msg, url) {
    const options = {
      autoDismissTimeout: 30000
    };

    if (!this.openmct.editor.isEditing()) {
      options.link = {
        cssClass: '',
        text: 'click to view',
        onClick: this._navigateToNotebook(url)
      };
    }

    this.openmct.notifications.info(msg, options);
  }

  _navigateToNotebook(url = null) {
    if (!url) {
      return () => {};
    }

    return () => {
      location.hash = url;
    };
  }
}
