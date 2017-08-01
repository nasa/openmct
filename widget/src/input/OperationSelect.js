define(
    ['./Select'],
    function (Select) {

    function OperationSelect(conditionConfig, keySelect, selectManager) {
        var self = this;

        this.config = conditionConfig;
        this.keySelect = keySelect;
        this.manager = selectManager;

        this.operationKeys = [];
        this.evaluator = this.manager.getEvaluator();
        this.loadComplete = false;

        this.select = new Select('operation')
        this.select.addOption('','--Operation--');

        this.keySelect.on('change', onKeyChange);
        this.manager.on('metadata', onMetadataLoad);

        if (this.manager.metadataLoadCompleted()) {
            onMetadataLoad();
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
                self.loadOptions();
                self.generateOptions();
            }
            self.select.setSelected(self.config.operation);
        }

        return this.select;
    }

    OperationSelect.prototype.generateOptions = function () {
        var self = this,
            items = this.operationKeys.map( function(operation) {
                return [operation, self.evaluator.getOperationText(operation)];
            });
        items.splice(0, 0, ['','--Operation--'])
        this.select.setOptions(items);
    }

    OperationSelect.prototype.loadOptions = function (identifier) {
        var self = this,
            operations = self.evaluator.getOperationKeys(),
            key,
            type;

        key = identifier ? identifier[0] : self.config.key;
        type = self.manager.getTelemetryPropertyType(self.config.object, key);

        self.manager.getTelemetryPropertyType(self.config.object, key)
        self.operationKeys = operations.filter( function(operation) {
            return self.evaluator.operationAppliesTo(operation, type);
        });
    }

    OperationSelect.prototype.generateInputs = function () {

    }

    return OperationSelect;

});
