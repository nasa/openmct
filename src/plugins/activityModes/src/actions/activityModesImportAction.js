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

        this.csvObjects.map(function (activity) {
            activity.start = {timestamp:0, epoch:"SET"};
            activity.duration = {timestamp:Number(activity.duration), epoch: "SET"};
            activity.type = "activity";
        });

        this.csvObjects.forEach(function (activity, index) {
            var newActivityObject = instantiate(activity, 'activity-'+index);
            newActivityObject.getCapability('location').setPrimaryLocation(parent.getId());
            parentComposition.add(newActivityObject);
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