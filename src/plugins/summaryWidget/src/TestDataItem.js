define([
    'text!../res/testDataItemTemplate.html',
    './input/ObjectSelect',
    './input/KeySelect',
    'zepto'
], function (
    itemTemplate,
    ObjectSelect,
    KeySelect,
    $
) {

    // an individual mock telemetry value for test data
    // parameter:
    // conditionConfig: the configuration for this conditionConfig
    // index: the index of this TestDataItem object in it's parent TestDataManagers's data model,
    //        to be injected into callbacks for removes
    // conditionManager: a conditionManager instance for populating selects with
    //                    configuration data
    function TestDataItem(itemConfig, index, conditionManager) {
        this.config = itemConfig;
        this.index = index;
        this.conditionManager = conditionManager;

        this.domElement = $(itemTemplate);

        this.deleteButton = $('.t-delete', this.domElement);
        this.duplicateButton = $('.t-duplicate', this.domElement);

        this.callbacks = {
            remove: [],
            duplicate: [],
            change: []
        };

        this.selects = {};
        this.valueInputs = [];

        this.remove = this.remove.bind(this);
        this.duplicate = this.duplicate.bind(this);

        var self = this;

        function onSelectChange(value, property) {
            if (property === 'key') {
                self.generateValueInput(value);
            }
            self.callbacks.change.forEach(function (callback) {
                if (callback) {
                    callback(value, property, self.index);
                }
            });
        }

        function onValueInput(event) {
            var elem = event.target,
                value = (isNaN(elem.valueAsNumber) ? elem.value : elem.valueAsNumber);

            self.callbacks.change.forEach(function (callback) {
                if (callback) {
                    callback(value, 'value', self.index);
                }
            });
        }

        this.deleteButton.on('click', this.remove);
        this.duplicateButton.on('click', this.duplicate);

        this.selects.object = new ObjectSelect(this.config, this.conditionManager);
        this.selects.key = new KeySelect(this.config, this.selects.object, this.conditionManager, onSelectChange);

        this.selects.object.on('change', onSelectChange);

        Object.values(this.selects).forEach(function (select) {
            $('.t-configuration', self.domElement).append(select.getDOM());
        });

        $(this.domElement).on('input', 'input', onValueInput);
    }


    TestDataItem.prototype.getDOM = function (container) {
        return this.domElement;
    };

    TestDataItem.prototype.on = function (event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    };

    TestDataItem.prototype.hideButtons = function () {
        this.deleteButton.hide();
    };

    TestDataItem.prototype.remove = function () {
        var self = this;
        this.callbacks.remove.forEach(function (callback) {
            if (callback) {
                callback(self.index);
            }
        });
    };

    TestDataItem.prototype.duplicate = function () {
        var sourceItem = JSON.parse(JSON.stringify(this.config)),
            self = this;
        this.callbacks.duplicate.forEach(function (callback) {
            if (callback) {
                callback(sourceItem, self.index);
            }
        });
    };

    TestDataItem.prototype.generateValueInput = function (key) {
        var evaluator = this.conditionManager.getEvaluator(),
            inputArea = $('.t-value-inputs', this.domElement),
            dataType = this.conditionManager.getTelemetryPropertyType(this.config.object, key),
            inputType = evaluator.getInputTypeById(dataType);

        inputArea.html('');
        if (inputType) {
            if (!this.config.value) {
                this.config.value = (inputType === 'number' ? 0 : '');
            }
            this.valueInput = $('<input type = "' + inputType + '" value = "' + this.config.value + '"> </input>').get(0);
            inputArea.append(this.valueInput);
        }
    };

    return TestDataItem;
});
