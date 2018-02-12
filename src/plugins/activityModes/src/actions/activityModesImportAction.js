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
        this.parent = this.context.domainObject;
        this.parentId = this.parent.getId();
        this.parentComposition = this.parent.getCapability("composition");

        var activitiesObjects = [],
            activityModesObjects = [];

        csvObjects.forEach(function (activity) {
            var newActivity = {},
                newActivityMode = {};

            newActivity.name = activity.name;
            newActivity.start = {timestamp: 0, epoch: "SET"};
            newActivity.duration = {timestamp: Number(activity.duration), epoch: "SET"};
            newActivity.type = "activity";
            newActivity.composition = [];
            newActivity.relationships = {modes: []};

            activitiesObjects.push(newActivity);

            newActivityMode.name = activity.name + ' Resources';
            newActivityMode.resources = {comms: Number(activity.comms), power: Number(activity.power)};
            newActivityMode.type = 'mode';

            activityModesObjects.push(newActivityMode);
        });

        this.createActivityModesFolder().then(function (folder) {
            var folderComposition = folder.getCapability('composition');

            this.instantiateActivityModes(activityModesObjects, folderComposition);
            this.instantiateActivities(activitiesObjects);
        }.bind(this));
    };

    ActivityModesImportAction.prototype.instantiateActivityModes = function (activityModesObjects, folderComposition) {
        activityModesObjects.forEach(function (activityMode, index) {
            var objectId = 'activity-mode-' + index;

            this.objectService.getObjects([objectId]).then(
                function (previousActivityMode) {
                    previousActivityMode[objectId].getCapability('mutation').mutate(function (prev) {
                        prev.name = activityMode.name;
                        prev.resources = activityMode.resources;
                        prev.type = activityMode.type;
                    });

                    previousActivityMode[objectId].getCapability('location').setPrimaryLocation('activity-modes-folder');
                    folderComposition.add(previousActivityMode[objectId]); 
                }
            );
        }.bind(this));
    };

    ActivityModesImportAction.prototype.instantiateActivities = function (activitiesObjects) {
        activitiesObjects.forEach(function (activity, index) {
            activity.relationships.modes.push('activity-mode-' + index);
            activity.id = 'activity-' + index;

            this.objectService.getObjects([activity.id]).then(
                function (objects) {
                    objects[activity.id].getCapability('mutation').mutate(function (prevActivity) {
                        prevActivity.name = activity.name;
                        prevActivity.start = activity.start;
                        prevActivity.duration = activity.duration;
                        prevActivity.type = activity.type;
                        prevActivity.composition = activity.composition;
                        prevActivity.relationships = activity.relationships;
                        prevActivity.id = activity.id;
                    });

                    objects[activity.id].getCapability('location').setPrimaryLocation(this.parentId);
                    this.parentComposition.add(objects[activity.id]);
                }.bind(this)
            );
        }.bind(this));
    };

    ActivityModesImportAction.prototype.createActivityModesFolder = function () {
        return new Promise(function (resolve, reject) {
            this.objectService.getObjects(['activity-modes-folder']).then(function (objects) {
                var folder = objects['activity-modes-folder'];
    
                folder.getCapability('mutation').mutate(function (persistedObject) {
                    persistedObject.name = 'Activity-Modes';
                    persistedObject.type = 'folder';
                    persistedObject.composition = [];
                });
                folder.getCapability('location').setPrimaryLocation(this.parent.getId());
    
                this.parent.getCapability('composition').add(folder);

                resolve(folder);
            }.bind(this));
        }.bind(this));
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
