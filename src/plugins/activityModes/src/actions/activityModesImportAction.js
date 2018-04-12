define(['d3-dsv'], function (d3Dsv) {

    function ActivityModesImportAction(dialogService, openmct, context) {
        this.dialogService = dialogService;
        this.openmct = openmct;
        this.context = context;
        this.parent = this.context.domainObject;
        this.instantiate = this.openmct.$injector.get("instantiate");
        this.objectService = this.openmct.$injector.get("objectService").objectService;
        this.populateActivities = this.populateActivities.bind(this);
    }

    ActivityModesImportAction.prototype.perform = function () {
        this.parentId = this.parent.getId();

        this.dialogService.getUserInput(this.getFormModel(), function () {})
        .then(function (form) {
            if (form.selectFile.name.slice(-3) !== 'csv') {
                this.displayError();
            }

            this.csvParse(form.selectFile.body).then(this.populateActivities);
        }.bind(this));
    };

    ActivityModesImportAction.prototype.csvParse = function (csvString) {
        return new Promise(function (resolve, reject) {
            var parsedObject = d3Dsv.csvParse(csvString);

            return parsedObject ? resolve(parsedObject) : reject('Could not parse provided file');
        });
    };

    ActivityModesImportAction.prototype.populateActivities = function (csvObjects) {
        this.parentComposition = this.parent.getCapability("composition");
        this.blockingDialog = this.showBlockingMessage();

        var activitiesObjects = {},
            activityModesObjects = {};

        csvObjects.forEach(function (activity, index) {
            var newActivity = {},
                newActivityMode = {},
                duration = !isNaN(Number(activity.duration)) ? 1000 * Number(activity.duration) : 0;

            newActivity.name = activity.name;
            newActivity.id = activity.id ? ('activity-' + activity.id) : ('activity-' + index + '-' + this.parentId);
            newActivity.start = {timestamp: 0, epoch: "SET"};
            newActivity.duration = {timestamp: duration, epoch: "SET"};
            newActivity.type = "activity";
            newActivity.composition = [];
            newActivity.relationships = {modes: []};

            newActivityMode.name = activity.name + ' Resources';
            newActivityMode.id = activity.id ? ('activity-mode-' + activity.id) : ('activity-mode-' + index + '-' + this.parentId);
            newActivityMode.resources = {comms: Number(activity.comms) || 0, power: Number(activity.power) || 0};
            newActivityMode.type = 'mode';

            newActivity.relationships.modes.push(newActivityMode.id);

            activitiesObjects[newActivity.id] = newActivity;
            activityModesObjects[newActivityMode.id] = newActivityMode;
        }.bind(this));

        this.instantiateActivityModes(activityModesObjects);
        this.instantiateActivities(activitiesObjects);
    };

    ActivityModesImportAction.prototype.instantiateActivityModes = function (activityModesObjects) {
        var activityModesArray = Object.keys(activityModesObjects);

        this.objectService.getObjects(activityModesArray).then(
            function (previousActivityModes) {
                activityModesArray.forEach(function (activityModeId) {
                    previousActivityModes[activityModeId].getCapability('mutation').mutate(function (prev) {
                        var activityMode = activityModesObjects[activityModeId];

                        prev.name = activityMode.name;
                        prev.resources = activityMode.resources;
                        prev.type = activityMode.type;
                        prev.id = activityMode.id;
                    });
                });
            }
        );
    };

    ActivityModesImportAction.prototype.instantiateActivities = function (activitiesObjects) {
        var activityObjectArray = Object.keys(activitiesObjects);

        this.objectService.getObjects(activityObjectArray).then(
            function (objects) {
                activityObjectArray.forEach(function (activityId, index) {
                    var activity = activitiesObjects[activityId];

                    objects[activityId].getCapability('mutation').mutate(function (prevActivity) {
                        prevActivity.name = activity.name;
                        prevActivity.start = activity.start;
                        prevActivity.duration = activity.duration;
                        prevActivity.type = activity.type;
                        prevActivity.composition = activity.composition;
                        prevActivity.relationships = activity.relationships;
                        prevActivity.id = activity.id;
                    });

                    objects[activityId].getCapability('location').setPrimaryLocation(this.parentId);

                    if ((index === (activityObjectArray.length - 1)) && this.blockingDialog) {
                        this.blockingDialog.dismiss();
                    }
                }.bind(this));

                this.parentComposition.domainObject.getCapability('mutation').mutate(function (parentComposition) {
                    parentComposition.composition = activityObjectArray;
                });
            }.bind(this)
        );
    };

    ActivityModesImportAction.prototype.showBlockingMessage = function () {
        var model = {
            title: "Importing",
            actionText:  "Importing Activities from CSV",
            severity: "info",
            unknownProgress: true
        };

        return this.dialogService.showBlockingMessage(model);
    };

    ActivityModesImportAction.prototype.displayError = function () {
        var dialog,
        perform = this.perform.bind(this),
        model = {
            title: "Invalid File",
            actionText:  "The selected file was not a valid CSV file",
            severity: "error",
            options: [
                {
                    label: "Ok",
                    callback: function () {
                        dialog.dismiss();
                        perform();
                    }
                }
            ]
        };
        dialog = this.dialogService.showBlockingMessage(model);
    };

    ActivityModesImportAction.prototype.getFormModel = function () {
        return {
            name: 'Import activities from CSV',
            sections: [
                {
                    name: 'Import A File',
                    rows: [
                        {
                            name: 'Select File',
                            key: 'selectFile',
                            control: 'file-input',
                            required: true,
                            text: 'Select File'
                        }
                    ]
                }
            ]
        };
    };

    return ActivityModesImportAction;
});
