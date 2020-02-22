import { addNotebookEntry } from './utils/notebook-entries';
import { getDefaultNotebook } from './utils/notebook-storage';

export default class Snapshot {
    constructor(openmct) {
        this.openmct = openmct;
        this.exportImageService = openmct.$injector.get('exportImageService');
        this.dialogService = openmct.$injector.get('dialogService');

        this.capture = this.capture.bind(this);
        this._saveSnapShot = this._saveSnapShot.bind(this);
    }

    capture(snapShotDomainObject, domElement) {
        this.exportImageService.exportPNGtoSRC(domElement, 's-status-taking-snapshot')
            .then(function (blob) {
                var reader = new window.FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    this._saveSnapShot(reader.result, snapShotDomainObject);
                }.bind(this);
            }.bind(this));
    }

    /**
     * @private
     */
    _generateTaskForm(url) {
        var taskForm = {
            name: "Create a Notebook Entry",
            hint: "Please select a Notebook",
            sections: [{
                rows: [
                    {
                        name: 'Entry',
                        key: 'entry',
                        control: 'textarea',
                        required: false,
                        cssClass: "l-textarea-sm"
                    },
                    {
                        name: 'Snap Preview',
                        key:"snapPreview",
                        control: "snap-view",
                        cssClass: "l-textarea-sm",
                        src: url
                    },
                    {
                        name: 'Save in Notebook',
                        key: 'notebook',
                        control: 'locator',
                        validate: validateLocation
                    }
                ]
            }]
        };

        var overlayModel = {
            title: taskForm.name,
            message: 'Notebook Snapshot',
            structure: taskForm,
            value: {'entry': ""}
        };

        function validateLocation(newParentObj) {
            return newParentObj.model.type === 'notebook';
        }

        return overlayModel;
    }

    /**
     * @private
     */
    _saveSnapShot(imageUrl, snapShotDomainObject) {
        const type = this.openmct.types.get(snapShotDomainObject.type);
        const embedObject = {
            id: snapShotDomainObject.identifier.key,
            cssClass: type.cssClass,
            name: snapShotDomainObject.name
        };

        const notebookStorage = getDefaultNotebook();
        this.openmct.objects.get(notebookStorage.notebookMeta.identifier)
            .then(domainObject => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, embedObject, imageUrl);
            });
    }
}
