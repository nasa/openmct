import { addNotebookEntry, createNewEmbed } from './utils/notebook-entries';
import { getDefaultNotebook } from './utils/notebook-storage';
import { NOTEBOOK_DEFAULT } from '@/plugins/notebook/notebook-constants';
import SnapShotContainer from './snapshot-container';

export default class Snapshot {
    constructor(openmct) {
        this.openmct = openmct;
        this.exportImageService = openmct.$injector.get('exportImageService');
        this.dialogService = openmct.$injector.get('dialogService');

        this.capture = this.capture.bind(this);
        this._saveSnapShot = this._saveSnapShot.bind(this);
    }

    capture(notebookType, snapShotDomainObject, domElement, bounds) {
        this.exportImageService.exportPNGtoSRC(domElement, 's-status-taking-snapshot')
            .then(function (blob) {
                const reader = new window.FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    this._saveSnapShot(notebookType, reader.result, snapShotDomainObject, bounds);
                }.bind(this);
            }.bind(this));
    }

    /**
     * @private
     */
    _saveSnapShot(notebookType, imageUrl, snapShotDomainObject, bounds) {
        const type = this.openmct.types.get(snapShotDomainObject.type);
        const embed = createNewEmbed(bounds, snapShotDomainObject.name, type.cssClass, snapShotDomainObject.identifier.key, imageUrl ? { src: imageUrl } : '');
        if (notebookType === NOTEBOOK_DEFAULT) {
            this._saveToDefaultNoteBook(embed, imageUrl);

            return;
        }

        this._saveToNotebookSnapshots(embed, imageUrl);
    }

    /**
     * @private
     */
    _saveToDefaultNoteBook(embed, imageUrl) {
        const notebookStorage = getDefaultNotebook();
        this.openmct.objects.get(notebookStorage.notebookMeta.identifier)
            .then(domainObject => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, embed);

                const defaultPath = `${domainObject.name} > ${notebookStorage.section.name} > ${notebookStorage.page.name}`;
                const msg = `Saved to Notebook ${defaultPath}`;
                this._showNotification(msg);
            });
    }

    /**
     * @private
     */
    _saveToNotebookSnapshots(embed, imageUrl) {
        SnapShotContainer.addSnapshot(embed);

        const msg = 'Saved to Notebook Snapshots - click to view.';
        this._showNotification(msg);
    }

    _showNotification(msg) {
        this.openmct.notifications.info(msg);
    }
}
