define([
  '../res/conditionTemplate.html',
  './input/ObjectSelect',
  './input/KeySelect',
  './input/OperationSelect',
  './eventHelpers',
  '../../../utils/template/templateHelpers',
  'EventEmitter'
], function (
  conditionTemplate,
  ObjectSelect,
  KeySelect,
  OperationSelect,
  eventHelpers,
  templateHelpers,
  EventEmitter
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
    eventHelpers.extend(this);
    this.config = conditionConfig;
    this.index = index;
    this.conditionManager = conditionManager;

    this.domElement = templateHelpers.convertTemplateToHTML(conditionTemplate)[0];

    this.eventEmitter = new EventEmitter();
    this.supportedCallbacks = ['remove', 'duplicate', 'change'];

    this.deleteButton = this.domElement.querySelector('.t-delete');
    this.duplicateButton = this.domElement.querySelector('.t-duplicate');

    this.selects = {};
    this.valueInputs = [];

    this.remove = this.remove.bind(this);
    this.duplicate = this.duplicate.bind(this);

    const self = this;

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

      self.eventEmitter.emit('change', {
        value: value,
        property: property,
        index: self.index
      });
    }

    /**
     * Event handler for this conditions value inputs
     * @param {Event} event The oninput event that triggered this callback
     * @private
     */
    function onValueInput(event) {
      const elem = event.target;
      const value = isNaN(Number(elem.value)) ? elem.value : Number(elem.value);
      const inputIndex = self.valueInputs.indexOf(elem);

      self.eventEmitter.emit('change', {
        value: value,
        property: 'values[' + inputIndex + ']',
        index: self.index
      });
    }

    this.listenTo(this.deleteButton, 'click', this.remove, this);
    this.listenTo(this.duplicateButton, 'click', this.duplicate, this);

    this.selects.object = new ObjectSelect(this.config, this.conditionManager, [
      ['any', 'any telemetry'],
      ['all', 'all telemetry']
    ]);
    this.selects.key = new KeySelect(this.config, this.selects.object, this.conditionManager);
    this.selects.operation = new OperationSelect(
      this.config,
      this.selects.key,
      this.conditionManager,
      function (value) {
        onSelectChange(value, 'operation');
      }
    );

    this.selects.object.on('change', function (value) {
      onSelectChange(value, 'object');
    });
    this.selects.key.on('change', function (value) {
      onSelectChange(value, 'key');
    });

    Object.values(this.selects).forEach(function (select) {
      self.domElement.querySelector('.t-configuration').append(select.getDOM());
    });

    this.listenTo(this.domElement.querySelector('.t-value-inputs'), 'input', onValueInput);
  }

  Condition.prototype.getDOM = function (container) {
    return this.domElement;
  };

  /**
   * Register a callback with this condition: supported callbacks are remove, change,
   * duplicate
   * @param {string} event The key for the event to listen to
   * @param {function} callback The function that this rule will envoke on this event
   * @param {Object} context A reference to a scope to use as the context for
   *                         context for the callback function
   */
  Condition.prototype.on = function (event, callback, context) {
    if (this.supportedCallbacks.includes(event)) {
      this.eventEmitter.on(event, callback, context || this);
    }
  };

  /**
   * Hide the appropriate inputs when this is the only condition
   */
  Condition.prototype.hideButtons = function () {
    this.deleteButton.style.display = 'none';
  };

  /**
   * Remove this condition from the configuration. Invokes any registered
   * remove callbacks
   */
  Condition.prototype.remove = function () {
    this.eventEmitter.emit('remove', this.index);
    this.destroy();
  };

  Condition.prototype.destroy = function () {
    this.stopListening();
    Object.values(this.selects).forEach(function (select) {
      select.destroy();
    });
  };

  /**
   * Make a deep clone of this condition's configuration and invoke any duplicate
   * callbacks with the cloned configuration and this rule's index
   */
  Condition.prototype.duplicate = function () {
    const sourceCondition = JSON.parse(JSON.stringify(this.config));
    this.eventEmitter.emit('duplicate', {
      sourceCondition: sourceCondition,
      index: this.index
    });
  };

  /**
   * When an operation is selected, create the appropriate value inputs
   * and add them to the view. If an operation is of type enum, create
   * a drop-down menu instead.
   *
   * @param {string} operation The key of currently selected operation
   */
  Condition.prototype.generateValueInputs = function (operation) {
    const evaluator = this.conditionManager.getEvaluator();
    const inputArea = this.domElement.querySelector('.t-value-inputs');
    let inputCount;
    let inputType;
    let newInput;
    let index = 0;
    let emitChange = false;

    inputArea.innerHTML = '';
    this.valueInputs = [];
    this.config.values = this.config.values || [];

    if (evaluator.getInputCount(operation)) {
      inputCount = evaluator.getInputCount(operation);
      inputType = evaluator.getInputType(operation);

      while (index < inputCount) {
        if (inputType === 'select') {
          const options = this.generateSelectOptions();

          newInput = document.createElement('select');
          newInput.innerHTML = options;

          emitChange = true;
        } else {
          const defaultValue = inputType === 'number' ? 0 : '';
          const value = this.config.values[index] || defaultValue;
          this.config.values[index] = value;

          newInput = document.createElement('input');
          newInput.type = `${inputType}`;
          newInput.value = `${value}`;
        }

        this.valueInputs.push(newInput);
        inputArea.appendChild(newInput);
        index += 1;
      }

      if (emitChange) {
        this.eventEmitter.emit('change', {
          value: Number(newInput[0].options[0].value),
          property: 'values[0]',
          index: this.index
        });
      }
    }
  };

  Condition.prototype.generateSelectOptions = function () {
    let telemetryMetadata = this.conditionManager.getTelemetryMetadata(this.config.object);
    let options = '';
    telemetryMetadata[this.config.key].enumerations.forEach((enumeration) => {
      options += '<option value="' + enumeration.value + '">' + enumeration.string + '</option>';
    });

    return options;
  };

  return Condition;
});
