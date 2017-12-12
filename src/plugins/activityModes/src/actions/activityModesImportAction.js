define(['d3-dsv'], function (d3Dsv) {

    function ActivityModesImportAction(dialogService, openmct, context) {
        this.dialogService = dialogService;
        this.context = context;
    }

    ActivityModesImportAction.prototype.perform = function () {
        this.dialogService.getUserInput(this.getFormModel(), function () {})
        .then(function (form) {
            window.localStorage.setItem('csvObjects',
            JSON.stringify(d3Dsv.csvParse(form.selectFile.body)));
        }.bind(this));
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