define(['d3-dsv'], function (d3Dsv) {

    function ActivityModesImportAction(dialogService, openmct, context) {
        this.dialogService = dialogService;
        this.openmct = openmct;
        this.context = context;
        this.parent = this.context.domainObject;
        this.parentId = this.parent.getId();
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
        this.parentComposition = this.parent.getCapability("composition");

        var activitiesObjects = [],
            activityModesObjects = [];

        csvObjects.forEach(function (activity, index) {
            var newActivity = {},
                newActivityMode = {};

            newActivity.name = activity.name;
            newActivity.id = activity.id ? ('activity-' + activity.id) : ('activity-' + index + '-' + this.parentId);
            newActivity.start = {timestamp: 0, epoch: "SET"};
            newActivity.duration = {timestamp: Number(activity.duration), epoch: "SET"};
            newActivity.type = "activity";
            newActivity.composition = [];
            newActivity.relationships = {modes: []};

            newActivityMode.name = activity.name + ' Resources';
            newActivityMode.id = activity.id ? ('activity-mode-' + activity.id) : ('activity-mode-' + index + '-' + this.parentId);
            newActivityMode.resources = {comms: Number(activity.comms), power: Number(activity.power)};
            newActivityMode.type = 'mode';

            newActivity.relationships.modes.push(newActivityMode.id);

            activitiesObjects.push(newActivity);
            activityModesObjects.push(newActivityMode);
        });

        this.instantiateActivityModes(activityModesObjects);
        this.instantiateActivities(activitiesObjects);
    };

    ActivityModesImportAction.prototype.instantiateActivityModes = function (activityModesObjects) {
        activityModesObjects.forEach(function (activityMode) {

            this.objectService.getObjects([activityMode.id]).then(
                function (previousActivityMode) {
                    previousActivityMode[activityMode.id].getCapability('mutation').mutate(function (prev) {
                        prev.name = activityMode.name;
                        prev.resources = activityMode.resources;
                        prev.type = activityMode.type;
                        prev.id = activityMode.id;
                    });
                }
            );
        }.bind(this));
    };

    ActivityModesImportAction.prototype.instantiateActivities = function (activitiesObjects) {
        activitiesObjects.forEach(function (activity) {

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
