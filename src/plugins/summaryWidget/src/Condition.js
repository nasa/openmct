define(
    [
      'text!../res/conditionTemplate.html',
      './input/Select',
      './input/ObjectSelect',
      './input/KeySelect',
      './input/OperationSelect'
    ],
    function (
        conditionTemplate,
        Select,
        ObjectSelect,
        KeySelect,
        OperationSelect
    ) {

    // an individual condition for a summary widget rule.
    // parameter:
    // conditionConfig: the configuration for this conditionConfig
    // index: the index of this Condition object in it's parent Rule's data model,
    //        to be injected into callbacks for removes
    // conditionManager: a conditionManager instance for populating selects with
    //                    configuration data
    function Condition(conditionConfig, index, conditionManager) {
        this.config = conditionConfig;
        this.index = index;
        this.conditionManager = conditionManager;

        this.domElement = $(conditionTemplate);

        this.deleteButton = $('.t-delete', this.domElement);
        this.duplicateButton = $('.t-duplicate', this.domElement)

        this.callbacks = {
            remove: [],
            duplicate: [],
            change: []
        }

        this.selects = {}
        this.valueInputs = [];

        this.remove = this.remove.bind(this);
        this.duplicate = this.duplicate.bind(this);

        var self = this;
        this.deleteButton.on('click', this.remove);
        this.duplicateButton.on('click', this.duplicate);

        this.selects.object = new ObjectSelect(this.config, this.conditionManager),
        this.selects.key = new KeySelect(this.config, this.selects.object, this.conditionManager),
        this.selects.operation = new OperationSelect(this.config, this.selects.key, this.conditionManager, onSelectChange)

        this.selects.object.on('change', onSelectChange);
        this.selects.key.on('change', onSelectChange);

        Object.values(this.selects).forEach( function(select) {
            $('.t-configuration', self.domElement).append(select.getDOM());
        });

        $(this.domElement).on('input', 'input', onValueInput);

        function onSelectChange(value, property) {
            self.callbacks.change.forEach( function (callback) {
                callback && callback(value, property, self.index);
            });
            if (property === 'operation') {
                self.generateValueInputs(value);
            }
        }

        function onValueInput(event) {
            var elem = event.target,
                value = elem.value,
                inputIndex = self.valueInputs.indexOf(elem);

            self.callbacks.change.forEach(function (callback) {
                callback && callback([value, ''], 'values[' + inputIndex + ']', self.index);
            });
        }
    }


    Condition.prototype.getDOM = function (container) {
        return this.domElement;
    }

    Condition.prototype.on = function (event, callback) {
        if(this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    Condition.prototype.hideButtons = function() {
        this.deleteButton.hide();
    }

    Condition.prototype.remove = function () {
        var self = this;
        this.callbacks.remove.forEach(function (callback) {
            callback && callback(self.index);
        });
        delete this;
    }

    Condition.prototype.duplicate = function () {
        var sourceCondition = JSON.parse(JSON.stringify(this.config)),
            self = this;
        this.callbacks.duplicate.forEach(function (callback) {
            callback && callback(sourceCondition, self.index);
        });
    }

    Condition.prototype.generateValueInputs = function(operation) {
        var evaluator = this.conditionManager.getEvaluator(),
            inputArea = $('.t-value-inputs', this.domElement),
            inputCount,
            inputType,
            index = 0;

        inputArea.html('');
        this.valueInputs = [];

        if (evaluator.getInputCount(operation[0])) {
            inputCount = evaluator.getInputCount(operation[0]);
            inputType = this.conditionManager.getInputType(evaluator.getOperationType(operation[0]));
            while (index < inputCount) {
                this.config.values[index] = this.config.values[index] || '';
                newInput = $('<input type = "' + inputType + '" value = "' + this.config.values[index] + '"> </input>');
                this.valueInputs.push(newInput.get(0));
                inputArea.append(newInput);
                index += 1;
            }
        }
    }

    return Condition;
});
