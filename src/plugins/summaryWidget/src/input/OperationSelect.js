define(
    ['./Select'],
    function (Select) {

    //wraps a generic Select and populates it with available operations
    function OperationSelect(conditionConfig, keySelect, conditionManager, changeCallback) {
        var self = this;

        this.config = conditionConfig;
        this.keySelect = keySelect;
        this.manager = conditionManager;

        this.operationKeys = [];
        this.evaluator = this.manager.getEvaluator();
        this.loadComplete = false;

        this.select = new Select('operation');
        this.select.addOption('','--Operation--');
        if (changeCallback) {
            this.select.on('change', changeCallback);
        }

        function onKeyChange(identifier) {
            var selected = self.config.operation;
            if (self.manager.metadataLoadCompleted()) {
                self.loadOptions(identifier);
                self.generateOptions();
                self.select.setSelected(selected);
            }
        }

        function onMetadataLoad() {
            if (self.manager.getTelemetryPropertyType(self.config.object, self.config.key)) {
                self.loadOptions(self.config.key);
                self.generateOptions();
            }
            self.select.setSelected(self.config.operation);
        }

        this.keySelect.on('change', onKeyChange);
        this.manager.on('metadata', onMetadataLoad);

        if (this.manager.metadataLoadCompleted()) {
            onMetadataLoad();
        }

        return this.select;
    }

    OperationSelect.prototype.generateOptions = function () {
        var self = this,
            items = this.operationKeys.map( function(operation) {
                return [operation, self.evaluator.getOperationText(operation)];
            });
        items.splice(0, 0, ['','--Operation--']);
        this.select.setOptions(items);
    };

    OperationSelect.prototype.loadOptions = function (key) {
        var self = this,
            operations = self.evaluator.getOperationKeys(),
            type;

        type = self.manager.getTelemetryPropertyType(self.config.object, key);

        self.operationKeys = operations.filter( function(operation) {
            return self.evaluator.operationAppliesTo(operation, type);
        });
    };

    return OperationSelect;

});
