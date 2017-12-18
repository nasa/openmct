define(['d3-dsv'], function (d3Dsv) {

    function ActivityModesImportAction(dialogService, openmct, context) {
        this.dialogService = dialogService;
        this.openmct = openmct;
        this.context = context;
    }

    ActivityModesImportAction.prototype.perform = function () {
        this.dialogService.getUserInput(this.getFormModel(), function () {})
        .then(function (form) {
            this.csvObjects = d3Dsv.csvParse(form.selectFile.body);
            this.instantiateActivities();
        }.bind(this));
    };

    ActivityModesImportAction.prototype.instantiateActivities = function () {
        var instantiate = this.openmct.$injector.get("instantiate");
        var parent = this.context.domainObject;
        var parentComposition = parent.getCapability("composition");
        var activitiesObjects = [];
        var activityModesObjects = [];

        this.csvObjects.forEach(function (activity) {
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
            newActivityModeInstance.getCapability('location').setPrimaryLocation(parent.getId());
            parentComposition.add(newActivityModeInstance);
        });

        activitiesObjects.forEach(function (activity, index) {
            activity.relationships.modes.push({id: 'activity-modes-' + index});
            var newActivityInstance = instantiate(activity, 'activity-'+index);
            newActivityInstance.getCapability('location').setPrimaryLocation(parent.getId());
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