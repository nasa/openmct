define(['./Select', '../eventHelpers'], function (Select, eventHelpers) {
  /**
   * Create a {Select} element whose composition is dynamically updated with
   * the operations applying to a particular telemetry property
   * @constructor
   * @param {Object} config The current state of this select. Must have object,
   *                        key, and operation fields
   * @param {KeySelect} keySelect The linked Key Select instance to which
   *                              this OperationSelect should listen to for change
   *                              events
   * @param {ConditionManager} manager A ConditionManager instance from which
   *                                   to receive telemetry metadata
   * @param {function} changeCallback A change event callback to register with this
   *                                  select on initialization
   */
  const NULLVALUE = '- Select Comparison -';

  function OperationSelect(config, keySelect, manager, changeCallback) {
    eventHelpers.extend(this);
    const self = this;

    this.config = config;
    this.keySelect = keySelect;
    this.manager = manager;

    this.operationKeys = [];
    this.evaluator = this.manager.getEvaluator();
    this.loadComplete = false;

    this.select = new Select();
    this.select.hide();
    this.select.addOption('', NULLVALUE);
    if (changeCallback) {
      this.listenTo(this.select, 'change', changeCallback);
    }

    /**
     * Change event handler for the {KeySelect} to which this OperationSelect instance
     * is linked. Loads the operations applicable to the given telemetry property and updates
     * its select element's composition
     * @param {Object} key The key identifying the newly selected property
     * @private
     */
    function onKeyChange(key) {
      const selected = self.config.operation;
      if (self.manager.metadataLoadCompleted()) {
        self.loadOptions(key);
        self.generateOptions();
        self.select.setSelected(selected);
      }
    }

    /**
     * Event handler for the initial metadata load event from the associated
     * ConditionManager. Retrieves telemetry property types and updates the
     * select
     * @private
     */
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

  /**
   * Populate this select with options based on its current composition
   */
  OperationSelect.prototype.generateOptions = function () {
    const self = this;
    const items = this.operationKeys.map(function (operation) {
      return [operation, self.evaluator.getOperationText(operation)];
    });
    items.splice(0, 0, ['', NULLVALUE]);
    this.select.setOptions(items);

    if (this.select.options.length < 2) {
      this.select.hide();
    } else {
      this.select.show();
    }
  };

  /**
   * Retrieve the data type associated with a given telemetry property and
   * the applicable operations from the {ConditionEvaluator}
   * @param {string} key The telemetry property to load operations for
   */
  OperationSelect.prototype.loadOptions = function (key) {
    const self = this;
    const operations = self.evaluator.getOperationKeys();
    let type;

    type = self.manager.getTelemetryPropertyType(self.config.object, key);

    if (type !== undefined) {
      self.operationKeys = operations.filter(function (operation) {
        return self.evaluator.operationAppliesTo(operation, type);
      });
    }
  };

  OperationSelect.prototype.destroy = function () {
    this.stopListening();
  };

  return OperationSelect;
});
