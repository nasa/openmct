define([
  '../res/widgetTemplate.html',
  './Rule',
  './ConditionManager',
  './TestDataManager',
  './WidgetDnD',
  './eventHelpers',
  '../../../utils/template/templateHelpers',
  'objectUtils',
  'lodash',
  '@braintree/sanitize-url'
], function (
  widgetTemplate,
  Rule,
  ConditionManager,
  TestDataManager,
  WidgetDnD,
  eventHelpers,
  templateHelpers,
  objectUtils,
  _,
  urlSanitizeLib
) {
  //default css configuration for new rules
  const DEFAULT_PROPS = {
    color: '#cccccc',
    'background-color': '#666666',
    'border-color': 'rgba(0,0,0,0)'
  };

  /**
   * A Summary Widget object, which allows a user to configure rules based
   * on telemetry producing domain objects, and update a compact display
   * accordingly.
   * @constructor
   * @param {Object} domainObject The domain Object represented by this Widget
   * @param {MCT} openmct An MCT instance
   */
  function SummaryWidget(domainObject, openmct) {
    eventHelpers.extend(this);

    this.domainObject = domainObject;
    this.openmct = openmct;

    this.domainObject.configuration = this.domainObject.configuration || {};
    this.domainObject.configuration.ruleConfigById =
      this.domainObject.configuration.ruleConfigById || {};
    this.domainObject.configuration.ruleOrder = this.domainObject.configuration.ruleOrder || [
      'default'
    ];
    this.domainObject.configuration.testDataConfig = this.domainObject.configuration
      .testDataConfig || [
      {
        object: '',
        key: '',
        value: ''
      }
    ];

    this.activeId = 'default';
    this.rulesById = {};
    this.domElement = templateHelpers.convertTemplateToHTML(widgetTemplate)[0];
    this.toggleRulesControl = this.domElement.querySelector('.t-view-control-rules');
    this.toggleTestDataControl = this.domElement.querySelector('.t-view-control-test-data');

    this.widgetButton = this.domElement.querySelector(':scope > #widget');

    this.editing = false;
    this.container = '';
    this.editListenerUnsubscribe = () => {};

    this.outerWrapper = this.domElement.querySelector('.widget-edit-holder');
    this.ruleArea = this.domElement.querySelector('#ruleArea');
    this.configAreaRules = this.domElement.querySelector('.widget-rules-wrapper');

    this.testDataArea = this.domElement.querySelector('.widget-test-data');
    this.addRuleButton = this.domElement.querySelector('#addRule');

    this.conditionManager = new ConditionManager(this.domainObject, this.openmct);
    this.testDataManager = new TestDataManager(
      this.domainObject,
      this.conditionManager,
      this.openmct
    );

    this.watchForChanges = this.watchForChanges.bind(this);
    this.show = this.show.bind(this);
    this.destroy = this.destroy.bind(this);
    this.addRule = this.addRule.bind(this);

    this.addHyperlink(domainObject.url, domainObject.openNewTab);
    this.watchForChanges(openmct, domainObject);

    const self = this;

    /**
     * Toggles the configuration area for test data in the view
     * @private
     */
    function toggleTestData() {
      if (self.outerWrapper.classList.contains('expanded-widget-test-data')) {
        self.outerWrapper.classList.remove('expanded-widget-test-data');
      } else {
        self.outerWrapper.classList.add('expanded-widget-test-data');
      }

      if (self.toggleTestDataControl.classList.contains('c-disclosure-triangle--expanded')) {
        self.toggleTestDataControl.classList.remove('c-disclosure-triangle--expanded');
      } else {
        self.toggleTestDataControl.classList.add('c-disclosure-triangle--expanded');
      }
    }

    this.listenTo(this.toggleTestDataControl, 'click', toggleTestData);

    /**
     * Toggles the configuration area for rules in the view
     * @private
     */
    function toggleRules() {
      templateHelpers.toggleClass(self.outerWrapper, 'expanded-widget-rules');
      templateHelpers.toggleClass(self.toggleRulesControl, 'c-disclosure-triangle--expanded');
    }

    this.listenTo(this.toggleRulesControl, 'click', toggleRules);
  }

  /**
   * adds or removes href to widget button and adds or removes openInNewTab
   * @param {string} url String that denotes the url to be opened
   * @param {string} openNewTab String that denotes wether to open link in new tab or not
   */
  SummaryWidget.prototype.addHyperlink = function (url, openNewTab) {
    if (url) {
      this.widgetButton.href = urlSanitizeLib.sanitizeUrl(url);
    } else {
      this.widgetButton.removeAttribute('href');
    }

    if (openNewTab === 'newTab') {
      this.widgetButton.target = '_blank';
    } else {
      this.widgetButton.removeAttribute('target');
    }
  };

  /**
   * adds a listener to the object to watch for any changes made by user
   * only executes if changes are observed
   * @param {openmct} Object Instance of OpenMCT
   * @param {domainObject} Object instance of this object
   */
  SummaryWidget.prototype.watchForChanges = function (openmct, domainObject) {
    this.watchForChangesUnsubscribe = openmct.objects.observe(
      domainObject,
      '*',
      function (newDomainObject) {
        if (
          newDomainObject.url !== this.domainObject.url ||
          newDomainObject.openNewTab !== this.domainObject.openNewTab
        ) {
          this.addHyperlink(newDomainObject.url, newDomainObject.openNewTab);
        }
      }.bind(this)
    );
  };

  /**
   * Builds the Summary Widget's DOM, performs other necessary setup, and attaches
   * this Summary Widget's view to the supplied container.
   * @param {element} container The DOM element that will contain this Summary
   *                            Widget's view.
   */
  SummaryWidget.prototype.show = function (container) {
    const self = this;
    this.container = container;
    this.container.append(this.domElement);
    this.domElement.querySelector('.widget-test-data').append(this.testDataManager.getDOM());
    this.widgetDnD = new WidgetDnD(
      this.domElement,
      this.domainObject.configuration.ruleOrder,
      this.rulesById
    );
    this.initRule('default', 'Default');
    this.domainObject.configuration.ruleOrder.forEach(function (ruleId) {
      if (ruleId !== 'default') {
        self.initRule(ruleId);
      }
    });
    this.refreshRules();
    this.updateWidget();

    this.listenTo(this.addRuleButton, 'click', this.addRule);
    this.conditionManager.on('receiveTelemetry', this.executeRules, this);
    this.widgetDnD.on('drop', this.reorder, this);
  };

  /**
   * Unregister event listeners with the Open MCT APIs, unsubscribe from telemetry,
   * and clean up event handlers
   */
  SummaryWidget.prototype.destroy = function (container) {
    this.editListenerUnsubscribe();
    this.conditionManager.destroy();
    this.testDataManager.destroy();
    this.widgetDnD.destroy();
    this.watchForChangesUnsubscribe();
    Object.values(this.rulesById).forEach(function (rule) {
      rule.destroy();
    });

    this.stopListening();
  };

  /**
   * Update the view from the current rule configuration and order
   */
  SummaryWidget.prototype.refreshRules = function () {
    const self = this;
    const ruleOrder = self.domainObject.configuration.ruleOrder;
    const rules = self.rulesById;
    self.ruleArea.innerHTML = '';
    Object.values(ruleOrder).forEach(function (ruleId) {
      self.ruleArea.append(rules[ruleId].getDOM());
    });

    this.executeRules();
    this.addOrRemoveDragIndicator();
  };

  SummaryWidget.prototype.addOrRemoveDragIndicator = function () {
    const rules = this.domainObject.configuration.ruleOrder;
    const rulesById = this.rulesById;

    rules.forEach(function (ruleKey, index, array) {
      if (array.length > 2 && index > 0) {
        rulesById[ruleKey].domElement.querySelector('.t-grippy').style.display = '';
      } else {
        rulesById[ruleKey].domElement.querySelector('.t-grippy').style.display = 'none';
      }
    });
  };

  /**
   * Update the widget's appearance from the configuration of the active rule
   */
  SummaryWidget.prototype.updateWidget = function () {
    const WIDGET_ICON_CLASS = 'c-sw__icon js-sw__icon';
    const activeRule = this.rulesById[this.activeId];
    this.applyStyle(this.domElement.querySelector('#widget'), activeRule.getProperty('style'));
    this.domElement.querySelector('#widget').title = activeRule.getProperty('message');
    this.domElement.querySelector('#widgetLabel').innerHTML = activeRule.getProperty('label');
    this.domElement.querySelector('#widgetIcon').classList =
      WIDGET_ICON_CLASS + ' ' + activeRule.getProperty('icon');
  };

  /**
   * Get the active rule and update the Widget's appearance.
   */
  SummaryWidget.prototype.executeRules = function () {
    this.activeId = this.conditionManager.executeRules(
      this.domainObject.configuration.ruleOrder,
      this.rulesById
    );
    this.updateWidget();
  };

  /**
   * Add a new rule to this widget
   */
  SummaryWidget.prototype.addRule = function () {
    let ruleCount = 0;
    let ruleId;
    const ruleOrder = this.domainObject.configuration.ruleOrder;

    while (Object.keys(this.rulesById).includes('rule' + ruleCount)) {
      ruleCount++;
    }

    ruleId = 'rule' + ruleCount;
    ruleOrder.push(ruleId);
    this.domainObject.configuration.ruleOrder = ruleOrder;

    this.initRule(ruleId, 'Rule');
    this.updateDomainObject();
    this.refreshRules();
  };

  /**
   * Duplicate an existing widget rule from its configuration and splice it in
   * after the rule it duplicates
   * @param {Object} sourceConfig The configuration properties of the rule to be
   *                              instantiated
   */
  SummaryWidget.prototype.duplicateRule = function (sourceConfig) {
    let ruleCount = 0;
    let ruleId;
    const sourceRuleId = sourceConfig.id;
    const ruleOrder = this.domainObject.configuration.ruleOrder;
    const ruleIds = Object.keys(this.rulesById);

    while (ruleIds.includes('rule' + ruleCount)) {
      ruleCount = ++ruleCount;
    }

    ruleId = 'rule' + ruleCount;
    sourceConfig.id = ruleId;
    sourceConfig.name += ' Copy';
    ruleOrder.splice(ruleOrder.indexOf(sourceRuleId) + 1, 0, ruleId);
    this.domainObject.configuration.ruleOrder = ruleOrder;
    this.domainObject.configuration.ruleConfigById[ruleId] = sourceConfig;
    this.initRule(ruleId, sourceConfig.name);
    this.updateDomainObject();
    this.refreshRules();
  };

  /**
   * Initialize a new rule from a default configuration, or build a {Rule} object
   * from it if already exists
   * @param {string} ruleId An key to be used to identify this ruleId, or the key
                            of the rule to be instantiated
    * @param {string} ruleName The initial human-readable name of this rule
    */
  SummaryWidget.prototype.initRule = function (ruleId, ruleName) {
    let ruleConfig;
    const styleObj = {};

    Object.assign(styleObj, DEFAULT_PROPS);
    if (!this.domainObject.configuration.ruleConfigById[ruleId]) {
      this.domainObject.configuration.ruleConfigById[ruleId] = {
        name: ruleName || 'Rule',
        label: 'Unnamed Rule',
        message: '',
        id: ruleId,
        icon: ' ',
        style: styleObj,
        description: ruleId === 'default' ? 'Default appearance for the widget' : 'A new rule',
        conditions: [
          {
            object: '',
            key: '',
            operation: '',
            values: []
          }
        ],
        jsCondition: '',
        trigger: 'any',
        expanded: 'true'
      };
    }

    ruleConfig = this.domainObject.configuration.ruleConfigById[ruleId];
    this.rulesById[ruleId] = new Rule(
      ruleConfig,
      this.domainObject,
      this.openmct,
      this.conditionManager,
      this.widgetDnD,
      this.container
    );
    this.rulesById[ruleId].on('remove', this.refreshRules, this);
    this.rulesById[ruleId].on('duplicate', this.duplicateRule, this);
    this.rulesById[ruleId].on('change', this.updateWidget, this);
    this.rulesById[ruleId].on('conditionChange', this.executeRules, this);
  };

  /**
   * Given two ruleIds, move the source rule after the target rule and update
   * the view.
   * @param {Object} event An event object representing this drop with draggingId
   *                       and dropTarget fields
   */
  SummaryWidget.prototype.reorder = function (event) {
    const ruleOrder = this.domainObject.configuration.ruleOrder;
    const sourceIndex = ruleOrder.indexOf(event.draggingId);
    let targetIndex;

    if (event.draggingId !== event.dropTarget) {
      ruleOrder.splice(sourceIndex, 1);
      targetIndex = ruleOrder.indexOf(event.dropTarget);
      ruleOrder.splice(targetIndex + 1, 0, event.draggingId);
      this.domainObject.configuration.ruleOrder = ruleOrder;
      this.updateDomainObject();
    }

    this.refreshRules();
  };

  /**
   * Apply a list of css properties to an element
   * @param {element} elem The DOM element to which the rules will be applied
   * @param {object} style an object representing the style
   */
  SummaryWidget.prototype.applyStyle = function (elem, style) {
    Object.keys(style).forEach(function (propId) {
      elem.style[propId] = style[propId];
    });
  };

  /**
   * Mutate this domain object's configuration with the current local configuration
   */
  SummaryWidget.prototype.updateDomainObject = function () {
    this.openmct.objects.mutate(
      this.domainObject,
      'configuration',
      this.domainObject.configuration
    );
  };

  return SummaryWidget;
});
