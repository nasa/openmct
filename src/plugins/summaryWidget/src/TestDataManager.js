define([
  './eventHelpers',
  '../res/testDataTemplate.html',
  './TestDataItem',
  '../../../utils/template/templateHelpers',
  'lodash'
], function (eventHelpers, testDataTemplate, TestDataItem, templateHelpers, _) {
  /**
   * Controls the input and usage of test data in the summary widget.
   * @constructor
   * @param {Object} domainObject The summary widget domain object
   * @param {ConditionManager} conditionManager A conditionManager instance
   * @param {MCT} openmct and MCT instance
   */
  function TestDataManager(domainObject, conditionManager, openmct) {
    eventHelpers.extend(this);
    const self = this;

    this.domainObject = domainObject;
    this.manager = conditionManager;
    this.openmct = openmct;

    this.evaluator = this.manager.getEvaluator();
    this.domElement = templateHelpers.convertTemplateToHTML(testDataTemplate)[0];
    this.config = this.domainObject.configuration.testDataConfig;
    this.testCache = {};

    this.itemArea = this.domElement.querySelector('.t-test-data-config');
    this.addItemButton = this.domElement.querySelector('.add-test-condition');
    this.testDataInput = this.domElement.querySelector('.t-test-data-checkbox');

    /**
     * Toggles whether the associated {ConditionEvaluator} uses the actual
     * subscription cache or the test data cache
     * @param {Event} event The change event that triggered this callback
     * @private
     */
    function toggleTestData(event) {
      const elem = event.target;
      self.evaluator.useTestData(elem.checked);
      self.updateTestCache();
    }

    this.listenTo(this.addItemButton, 'click', function () {
      self.initItem();
    });
    this.listenTo(this.testDataInput, 'change', toggleTestData);

    this.evaluator.setTestDataCache(this.testCache);
    this.evaluator.useTestData(false);

    this.refreshItems();
  }

  /**
   * Get the DOM element representing this test data manager in the view
   */
  TestDataManager.prototype.getDOM = function () {
    return this.domElement;
  };

  /**
   * Initialze a new test data item, either from a source configuration, or with
   * the default empty configuration
   * @param {Object} [config] An object with sourceItem and index fields to instantiate
   *                          this rule from, optional
   */
  TestDataManager.prototype.initItem = function (config) {
    const sourceIndex = config && config.index;
    const defaultItem = {
      object: '',
      key: '',
      value: ''
    };
    let newItem;

    newItem = config !== undefined ? config.sourceItem : defaultItem;
    if (sourceIndex !== undefined) {
      this.config.splice(sourceIndex + 1, 0, newItem);
    } else {
      this.config.push(newItem);
    }

    this.updateDomainObject();
    this.refreshItems();
  };

  /**
   * Remove an item from this TestDataManager at the given index
   * @param {number} removeIndex The index of the item to remove
   */
  TestDataManager.prototype.removeItem = function (removeIndex) {
    _.remove(this.config, function (item, index) {
      return index === removeIndex;
    });
    this.updateDomainObject();
    this.refreshItems();
  };

  /**
   * Change event handler for the test data items which compose this
   * test data generateor
   * @param {Object} event An object representing this event, with value, property,
   *                       and index fields
   */
  TestDataManager.prototype.onItemChange = function (event) {
    this.config[event.index][event.property] = event.value;
    this.updateDomainObject();
    this.updateTestCache();
  };

  /**
   * Builds the test cache from the current item configuration, and passes
   * the new test cache to the associated {ConditionEvaluator} instance
   */
  TestDataManager.prototype.updateTestCache = function () {
    this.generateTestCache();
    this.evaluator.setTestDataCache(this.testCache);
    this.manager.triggerTelemetryCallback();
  };

  /**
   * Intantiate {TestDataItem} objects from the current configuration, and
   * update the view accordingly
   */
  TestDataManager.prototype.refreshItems = function () {
    const self = this;
    if (this.items) {
      this.items.forEach(function (item) {
        this.stopListening(item);
      }, this);
    }

    self.items = [];

    this.domElement.querySelectorAll('.t-test-data-item').forEach((item) => {
      item.remove();
    });

    this.config.forEach(function (item, index) {
      const newItem = new TestDataItem(item, index, self.manager);
      self.listenTo(newItem, 'remove', self.removeItem, self);
      self.listenTo(newItem, 'duplicate', self.initItem, self);
      self.listenTo(newItem, 'change', self.onItemChange, self);
      self.items.push(newItem);
    });

    self.items.forEach(function (item) {
      self.itemArea.prepend(item.getDOM());
    });

    if (self.items.length === 1) {
      self.items[0].hideButtons();
    }

    this.updateTestCache();
  };

  /**
   * Builds a test data cache in the format of a telemetry subscription cache
   * as expected by a {ConditionEvaluator}
   */
  TestDataManager.prototype.generateTestCache = function () {
    let testCache = this.testCache;
    const manager = this.manager;
    const compositionObjs = manager.getComposition();
    let metadata;

    testCache = {};
    Object.keys(compositionObjs).forEach(function (id) {
      testCache[id] = {};
      metadata = manager.getTelemetryMetadata(id);
      Object.keys(metadata).forEach(function (key) {
        testCache[id][key] = '';
      });
    });
    this.config.forEach(function (item) {
      if (testCache[item.object]) {
        testCache[item.object][item.key] = item.value;
      }
    });

    this.testCache = testCache;
  };

  /**
   * Update the domain object configuration associated with this test data manager
   */
  TestDataManager.prototype.updateDomainObject = function () {
    this.openmct.objects.mutate(this.domainObject, 'configuration.testDataConfig', this.config);
  };

  TestDataManager.prototype.destroy = function () {
    this.stopListening();
    this.items.forEach(function (item) {
      item.remove();
    });
  };

  return TestDataManager;
});
