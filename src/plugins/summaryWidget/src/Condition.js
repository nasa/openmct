define([
    'text!../res/conditionTemplate.html',
    './input/ObjectSelect',
    './input/KeySelect',
    './input/OperationSelect',
    'zepto'
], function (
    conditionTemplate,
    ObjectSelect,
    KeySelect,
    OperationSelect,
    $
) {

    /**
     * Represents an individual condition for a summary widget rule. Manages the
     * associated inputs and view.
     * @param {Object} conditionConfig The configurration for this condition, consisting
     *                                of object, key, operation, and values fields
     * @param {number} index the index of this Condition object in it's parent Rule's data model,
     *                        to be injected into callbacks for removes
     * @param {ConditionManager} conditionManager A ConditionManager instance for populating
     *                                            selects with configuration data
     */
    function Condition(conditionConfig, index, conditionManager) {
        this.config = conditionConfig;
        this.index = index;
        this.conditionManager = conditionManager;

        this.domElement = $(conditionTemplate);

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

        /**
         * Event handler for a change in one of this conditions' custom selects
         * @param {string} value The new value of this selects
         * @param {string} property The property of this condition to modify
         * @private
         */
        function onSelectChange(value, property) {
            if (property === 'operation') {
                self.generateValueInputs(value);
            }
            self.callbacks.change.forEach(function (callback) {
                if (callback) {
                    callback(value, property, self.index);
                }
            });
        }

        /**
         * Event handler for this conditions value inputs
         * @param {Event} event The oninput event that triggered this callback
         * @private
         */
        function onValueInput(event) {
            var elem = event.target,
                value = (isNaN(elem.valueAsNumber) ? elem.value : elem.valueAsNumber),
                inputIndex = self.valueInputs.indexOf(elem);

            self.callbacks.change.forEach(function (callback) {
                if (callback) {
                    callback(value, 'values[' + inputIndex + ']', self.index);
                }
            });
        }

        this.deleteButton.on('click', this.remove);
        this.duplicateButton.on('click', this.duplicate);

        this.selects.object = new ObjectSelect(this.config, this.conditionManager, [
            ['any', 'Any Telemetry'],
            ['all', 'All Telemetry']
        ]);
        this.selects.key = new KeySelect(this.config, this.selects.object, this.conditionManager);
        this.selects.operation = new OperationSelect(
            this.config,
            this.selects.key,
            this.conditionManager,
            function (value) {
                onSelectChange(value, 'operation');
            });

        this.selects.object.on('change', function (value) {
            onSelectChange(value, 'object');
        });
        this.selects.key.on('change', function (value) {
            onSelectChange(value, 'key');
        });

        Object.values(this.selects).forEach(function (select) {
            $('.t-configuration', self.domElement).append(select.getDOM());
        });

        $(this.domElement).on('input', 'input', onValueInput);
    }

    /**
     * Get the DOM element representing this condition in the view
     * @return {Element}
     */
    Condition.prototype.getDOM = function (container) {
        return this.domElement;
    };

    /**
     * Register an event callback with this conditition: supported callbacks are remove, change,
     * and duplicate
     * @param {string} event The key for the event to listen to
     * @param {function} callback The function that this rule will envoke on this event
     */
    Condition.prototype.on = function (event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    };

    /**
     * Hide the appropriate inputs when this is the only condition
     */
    Condition.prototype.hideButtons = function () {
        this.deleteButton.hide();
    };

    /**
     * Remove this condition from the configuration. Invokes any registered
     * remove callbacks
     */
    Condition.prototype.remove = function () {
        var self = this;
        this.callbacks.remove.forEach(function (callback) {
            if (callback) {
                callback(self.index);
            }
        });
    };

    /**
     * Make a deep clone of this condition's configuration and invoke any duplicate
     * callbacks with the cloned configuration and this rule's index
     */
    Condition.prototype.duplicate = function () {
        var sourceCondition = JSON.parse(JSON.stringify(this.config)),
            self = this;
        this.callbacks.duplicate.forEach(function (callback) {
            if (callback) {
                callback(sourceCondition, self.index);
            }
        });
    };

    /**
     * When an operation is selected, create the appropriate value inputs
     * and add them to the view
     * @param {string} operation The key of currently selected operation
     */
    Condition.prototype.generateValueInputs = function (operation) {
        var evaluator = this.conditionManager.getEvaluator(),
            inputArea = $('.t-value-inputs', this.domElement),
            inputCount,
            inputType,
            newInput,
            index = 0;

        inputArea.html('');
        this.valueInputs = [];

        if (evaluator.getInputCount(operation)) {
            inputCount = evaluator.getInputCount(operation);
            inputType = evaluator.getInputType(operation);
            while (index < inputCount) {
                if (!this.config.values[index]) {
                    this.config.values[index] = (inputType === 'number' ? 0 : '');
                }
                newInput = $('<input type = "' + inputType + '" value = "' + this.config.values[index] + '"> </input>');
                this.valueInputs.push(newInput.get(0));
                inputArea.append(newInput);
                index += 1;
            }
        }
    };

    return Condition;
});
