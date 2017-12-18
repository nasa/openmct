define(['d3-dsv'], function (d3Dsv) {

    function ActivityModesImportAction(dialogService, openmct, context) {
        this.dialogService = dialogService;
        this.openmct = openmct;
        this.context = context;

        this.instantiateActivities = this.instantiateActivities.bind(this);
    }

    ActivityModesImportAction.prototype.perform = function () {
        this.dialogService.getUserInput(this.getFormModel(), function () {})
        .then(function (form) {
            this.csvParse(form.selectFile.body).then(this.instantiateActivities);
        }.bind(this));
    };

    ActivityModesImportAction.prototype.csvParse = function (csvString) {
        return new Promise(function (resolve, reject) {
            var parsedObject = d3Dsv.csvParse(csvString);

            return parsedObject ? resolve(parsedObject) : reject('Could not parse provided file');
        });
    };

    ActivityModesImportAction.prototype.instantiateActivities = function (csvObjects) {
        var instantiate = this.openmct.$injector.get("instantiate"),
            parent = this.context.domainObject,
            parentId = parent.getId(),
            parentComposition = parent.getCapability("composition"),
            activitiesObjects = [],
            activityModesObjects = [];

        csvObjects.forEach(function (activity) {
            var newActivity = {},
                newActivityMode = {};

            newActivity.name = activity.name;
            newActivity.start = {timestamp:0, epoch:"SET"};
            newActivity.duration = {timestamp:Number(activity.duration), epoch: "SET"};
            newActivity.type = "activity";
            newActivity.relationships = {modes:[]};

            activitiesObjects.push(newActivity);

            newActivityMode.name = activity.name + ' Resources';
            newActivityMode.resources = {comms: Number(activity.comms), power:Number(activity.power)};
            newActivityMode.type = 'mode';

            activityModesObjects.push(newActivityMode);
        });

        activityModesObjects.forEach(function (activityMode, index) {
            var newActivityModeInstance = instantiate(activityMode, 'activity-mode-' + index);

            newActivityModeInstance.getCapability('location').setPrimaryLocation(parentId);
            parentComposition.add(newActivityModeInstance);
        });

        activitiesObjects.forEach(function (activity, index) {
            activity.relationships.modes.push('activity-mode-' + index);

            var newActivityInstance = instantiate(activity, 'activity-'+index);

            newActivityInstance.getCapability('location').setPrimaryLocation(parentId);
            parentComposition.add(newActivityInstance);
        });
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