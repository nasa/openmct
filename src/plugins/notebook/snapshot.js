import { NOTEBOOK_DEFAULT } from '@/plugins/notebook/notebook-constants';

import ImageExporter from '../../exporters/ImageExporter';
import SnapshotContainer from './snapshot-container';
import { addNotebookEntry, createNewEmbed } from './utils/notebook-entries';
import {
  createNotebookImageDomainObject,
  DEFAULT_SIZE,
  saveNotebookImageDomainObject,
  updateNamespaceOfDomainObject
} from './utils/notebook-image';
import {
  getDefaultNotebook,
  getDefaultNotebookLink,
  getNotebookSectionAndPage,
  setDefaultNotebook
} from './utils/notebook-storage';

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
