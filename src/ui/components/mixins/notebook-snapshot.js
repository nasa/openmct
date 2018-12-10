import $ from 'zepto';

function generateTaskForm() {
    var taskForm = {
        name: "Create a Notebook Entry",
        hint: "Please select a Notebook",
        sections: [{
            rows: [{
                name: 'Entry',
                key: 'entry',
                control: 'textarea',
                required: false,
                cssClass: "l-textarea-sm"
            },
            {
                name: 'Save in Notebook',
                key: 'notebook',
                control: 'locator',
                validate: validateLocation
            }]
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

function saveSnapShot(dialogService, imageUrl, imageType, imageSize, embedObject) {
    let taskForm = generateTaskForm();

    dialogService.getDialogResponse(
        'overlay-dialog',
        taskForm,
        () => taskForm.value
    ).then(options => {
        let snapshotObject = {
            src: imageUrl,
            type: imageType,
            size: imageSize
        };

        options.notebook.useCapability('mutation', function (model) {
            var date = Date.now();

            model.entries.push({
                id: 'entry-' + date,
                createdOn: date,
                text: options.entry,
                embeds: [{
                    name: embedObject.name,
                    cssClass: embedObject.cssClass,
                    type: embedObject.id,
                    id: 'embed-' + date,
                    createdOn: date,
                    snapshot: snapshotObject
                }]
            });
        });
    });
}

export default {
    inject: ['openmct', 'domainObject'],
    methods: {
        takeSnapshot() {
            let exportImageService = this.openmct.$injector.get('exportImageService'),
                dialogService = this.openmct.$injector.get('dialogService');

            let type = this.openmct.types.get(this.domainObject.type),
                embedObject = {
                    id: this.domainObject.identifier.key,
                    cssClass: type.cssClass,
                    name: this.domainObject.name
                };

            let elementToSnap =
                $(document.body).find('.overlay .object-holder')[0] ||
                $(document.body).find(".l-shell__main-container")[0];

            $(elementToSnap).addClass('s-status-taking-snapshot');

            exportImageService.exportPNGtoSRC(elementToSnap).then(function (blob) {
                $(elementToSnap).removeClass("s-status-taking-snapshot");

                if (blob) {
                    var reader = new window.FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        saveSnapShot(dialogService, reader.result, blob.type, blob.size, embedObject);
                    };
                }
            });
        }
    }
};
