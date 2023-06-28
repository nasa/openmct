define(['./Select', 'objectUtils'], function (Select, objectUtils) {
  /**
   * Create a {Select} element whose composition is dynamically updated with
   * the current composition of the Summary Widget
   * @constructor
   * @param {Object} config The current state of this select. Must have an
   *                        object field
   * @param {ConditionManager} manager A ConditionManager instance from which
   *                                   to receive the current composition status
   * @param {string[][]} baseOptions A set of [value, label] keyword pairs to
   *                                 display regardless of the composition state
   */
  function ObjectSelect(config, manager, baseOptions) {
    const self = this;

    this.config = config;
    this.manager = manager;

    this.select = new Select();
    this.baseOptions = [['', '- Select Telemetry -']];
    if (baseOptions) {
      this.baseOptions = this.baseOptions.concat(baseOptions);
    }

    this.baseOptions.forEach(function (option) {
      self.select.addOption(option[0], option[1]);
    });

    this.compositionObjs = this.manager.getComposition();
    self.generateOptions();

    /**
     * Add a new composition object to this select when a composition added
     * is detected on the Summary Widget
     * @param {Object} obj The newly added domain object
     * @private
     */
    function onCompositionAdd(obj) {
      self.select.addOption(objectUtils.makeKeyString(obj.identifier), obj.name);
    }

    /**
     * Refresh the composition of this select when a domain object is removed
     * from the Summary Widget's composition
     * @private
     */
    function onCompositionRemove() {
      const selected = self.select.getSelected();
      self.generateOptions();
      self.select.setSelected(selected);
    }

    /**
     * Defer setting the selected state on initial load until load is complete
     * @private
     */
    function onCompositionLoad() {
      self.select.setSelected(self.config.object);
    }

    this.manager.on('add', onCompositionAdd);
    this.manager.on('remove', onCompositionRemove);
    this.manager.on('load', onCompositionLoad);

    if (this.manager.loadCompleted()) {
      onCompositionLoad();
    }

    return this.select;
  }

  /**
   * Populate this select with options based on its current composition
   */
  ObjectSelect.prototype.generateOptions = function () {
    const items = Object.values(this.compositionObjs).map(function (obj) {
      return [objectUtils.makeKeyString(obj.identifier), obj.name];
    });
    this.baseOptions.forEach(function (option, index) {
      items.splice(index, 0, option);
    });
    this.select.setOptions(items);
  };

  return ObjectSelect;
});
