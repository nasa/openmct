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

    //TODO: impelement 'any telemetry' or 'all telemetry' options

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
            remove: $.noop,
            duplicate: $.noop,
            change: $.noop
        }

        this.selects = {}
        this.valueInputs = [];

        this.remove = this.remove.bind(this);
        this.duplicate = this.duplicate.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);
        this.onValueInput = this.onValueInput.bind(this);

        this.init();
    }

    Condition.prototype.init = function () {
        var self = this;
        this.deleteButton.on('click', this.remove);
        this.duplicateButton.on('click', this.duplicate);

        this.selects.object = new ObjectSelect(this.config, this.conditionManager),
        this.selects.key = new KeySelect(this.config, this.selects.object, this.conditionManager),
        this.selects.operation = new OperationSelect(this.config, this.selects.key, this.conditionManager, this.onSelectChange)

        this.selects.object.on('change', self.onSelectChange);
        this.selects.key.on('change', self.onSelectChange);

        Object.values(this.selects).forEach( function(select) {
            $('.t-configuration', self.domElement).append(select.getDOM());
        });

        $(this.domElement).on('input', 'input', this.onValueInput)
    }

    Condition.prototype.getDOM = function (container) {
        return this.domElement;
    }

    Condition.prototype.on = function (event, callback) {
        if(this.callbacks[event]) {
            this.callbacks[event] = callback;
        }
    }

    Condition.prototype.hideButtons = function() {
        this.deleteButton.hide();
    }

    Condition.prototype.remove = function () {
      this.callbacks['remove'] && this.callbacks['remove'](this.index);
      delete this;
    }

    Condition.prototype.duplicate = function () {
        var sourceCondition = JSON.parse(JSON.stringify(this.config));
        this.callbacks['duplicate'] && this.callbacks['duplicate'](sourceCondition, this.index);
    }

    Condition.prototype.onSelectChange = function (value, property) {
        this.callbacks['change'] && this.callbacks['change'](value, property, this.index);
        if (property === 'operation') {
            this.generateValueInputs(value);
        }
    }

    Condition.prototype.onValueInput = function (event) {
        var elem = event.target,
            value = elem.value,
            inputIndex = this.valueInputs.indexOf(elem);

        this.callbacks['change'] && this.callbacks['change']([value,''], 'values[' + inputIndex + ']', this.index);
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
