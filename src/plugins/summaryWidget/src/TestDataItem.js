define([
  '../res/testDataItemTemplate.html',
  './input/ObjectSelect',
  './input/KeySelect',
  './eventHelpers',
  '../../../utils/template/templateHelpers',
  'EventEmitter'
], function (itemTemplate, ObjectSelect, KeySelect, eventHelpers, templateHelpers, EventEmitter) {
  /**
   * An object representing a single mock telemetry value
   * @param {object} itemConfig the configuration for this item, consisting of
   *                            object, key, and value fields
   * @param {number} index the index of this TestDataItem object in the data
   *                 model of its parent {TestDataManager} o be injected into callbacks
   *                 for removes
   * @param {ConditionManager} conditionManager a conditionManager instance
   *                           for populating selects with configuration data
   * @constructor
   */
  function TestDataItem(itemConfig, index, conditionManager) {
    eventHelpers.extend(this);
    this.config = itemConfig;
    this.index = index;
    this.conditionManager = conditionManager;

    this.domElement = templateHelpers.convertTemplateToHTML(itemTemplate)[0];
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
     * A change event handler for this item's select inputs, which also invokes
     * change callbacks registered with this item
     * @param {string} value The new value of this select item
     * @param {string} property The property of this item to modify
     * @private
     */
    function onSelectChange(value, property) {
      if (property === 'key') {
        self.generateValueInput(value);
      }

      self.eventEmitter.emit('change', {
        value: value,
        property: property,
        index: self.index
      });
    }

    /**
     * An input event handler for this item's value field. Invokes any change
     * callbacks associated with this item
     * @param {Event} event The input event that initiated this callback
     * @private
     */
    function onValueInput(event) {
      const elem = event.target;
      const value = isNaN(elem.valueAsNumber) ? elem.value : elem.valueAsNumber;

      if (elem.tagName.toUpperCase() === 'INPUT') {
        self.eventEmitter.emit('change', {
          value: value,
          property: 'value',
          index: self.index
        });
      }
    }

    this.listenTo(this.deleteButton, 'click', this.remove);
    this.listenTo(this.duplicateButton, 'click', this.duplicate);

    this.selects.object = new ObjectSelect(this.config, this.conditionManager);
    this.selects.key = new KeySelect(
      this.config,
      this.selects.object,
      this.conditionManager,
      function (value) {
        onSelectChange(value, 'key');
      }
    );

    this.selects.object.on('change', function (value) {
      onSelectChange(value, 'object');
    });

    Object.values(this.selects).forEach(function (select) {
      self.domElement.querySelector('.t-configuration').append(select.getDOM());
    });
    this.listenTo(this.domElement, 'input', onValueInput);
  }

  /**
   * Gets the DOM associated with this element's view
   * @return {Element}
   */
  TestDataItem.prototype.getDOM = function (container) {
    return this.domElement;
  };

  /**
   * Register a callback with this item: supported callbacks are remove, change,
   * and duplicate
   * @param {string} event The key for the event to listen to
   * @param {function} callback The function that this rule will invoke on this event
   * @param {Object} context A reference to a scope to use as the context for
   *                         context for the callback function
   */
  TestDataItem.prototype.on = function (event, callback, context) {
    if (this.supportedCallbacks.includes(event)) {
      this.eventEmitter.on(event, callback, context || this);
    }
  };

  /**
   * Implement "off" to complete event emitter interface.
   */
  TestDataItem.prototype.off = function (event, callback, context) {
    this.eventEmitter.off(event, callback, context);
  };

  /**
   * Hide the appropriate inputs when this is the only item
   */
  TestDataItem.prototype.hideButtons = function () {
    this.deleteButton.style.display = 'none';
  };

  /**
   * Remove this item from the configuration. Invokes any registered
   * remove callbacks
   */
  TestDataItem.prototype.remove = function () {
    const self = this;
    this.eventEmitter.emit('remove', self.index);
    this.stopListening();

    Object.values(this.selects).forEach(function (select) {
      select.destroy();
    });
  };

  /**
   * Makes a deep clone of this item's configuration, and invokes any registered
   * duplicate callbacks with the cloned configuration as an argument
   */
  TestDataItem.prototype.duplicate = function () {
    const sourceItem = JSON.parse(JSON.stringify(this.config));
    const self = this;

    this.eventEmitter.emit('duplicate', {
      sourceItem: sourceItem,
      index: self.index
    });
  };

  /**
   * When a telemetry property key is selected, create the appropriate value input
   * and add it to the view
   * @param {string} key The key of currently selected telemetry property
   */
  TestDataItem.prototype.generateValueInput = function (key) {
    const evaluator = this.conditionManager.getEvaluator();
    const inputArea = this.domElement.querySelector('.t-value-inputs');
    const dataType = this.conditionManager.getTelemetryPropertyType(this.config.object, key);
    const inputType = evaluator.getInputTypeById(dataType);

    inputArea.innerHTML = '';
    if (inputType) {
      if (!this.config.value) {
        this.config.value = inputType === 'number' ? 0 : '';
      }

      const newInput = document.createElement('input');
      newInput.type = `${inputType}`;
      newInput.value = `${this.config.value}`;

      this.valueInput = newInput;
      inputArea.append(this.valueInput);
    }
  };

  return TestDataItem;
});
