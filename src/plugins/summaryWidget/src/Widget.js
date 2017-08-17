define([
    'text!../res/widgetTemplate.html',
    './Rule',
    './ConditionManager',
    './TestDataManager',
    './WidgetDnD',
    'lodash',
    'zepto'
], function (
    widgetTemplate,
    Rule,
    ConditionManager,
    TestDataManager,
    WidgetDnD,
    _,
    $
) {

    //default css configuration for new rules
    var DEFAULT_PROPS = {
        'color': '#000000',
        'background-color': '#00ff00',
        'border-color': '#666666'
    };

    // parameters
    // domainObject: the summary widget domain object represented by this view
    // openmct: an MCT instance
    function Widget(domainObject, openmct) {
        this.domainObject = domainObject;
        this.openmct = openmct;

        this.domainObject.configuration = this.domainObject.configuration || {};
        this.domainObject.configuration.ruleConfigById = this.domainObject.configuration.ruleConfigById || {};
        this.domainObject.configuration.ruleOrder = this.domainObject.configuration.ruleOrder || ['default'];
        this.domainObject.configuration.testDataConfig = this.domainObject.configuration.testDataConfig || [{
            object: '',
            key: '',
            value: ''
        }];

        this.activeId = 'default';
        this.rulesById = {};
        this.domElement = $(widgetTemplate);
        this.editing = false;
        this.container = '';
        this.ruleArea = $('#ruleArea', this.domElement);
        this.testDataArea = $('.widget-test-data', this.domElement);
        this.addRuleButton = $('#addRule', this.domElement);

        this.conditionManager = new ConditionManager(this.domainObject, this.openmct);
        this.testDataManager = new TestDataManager(this.domainObject, this.conditionManager, this.openmct);

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        this.addRule = this.addRule.bind(this);
        this.refreshRules = this.refreshRules.bind(this);
        this.duplicateRule = this.duplicateRule.bind(this);
        this.updateWidget = this.updateWidget.bind(this);
        this.executeRules = this.executeRules.bind(this);
        this.reorder = this.reorder.bind(this);
        this.onEdit = this.onEdit.bind(this);

        var id = this.domainObject.identifier.key,
            self = this,
            oldDomainObject,
            statusCapability;
        openmct.$injector.get('objectService')
            .getObjects([id])
            .then(function (objs) {
                oldDomainObject = objs[id];
                statusCapability = oldDomainObject.getCapability('status');
                statusCapability.listen(self.onEdit);
                if (statusCapability.get('editing')) {
                    self.onEdit(['editing']);
                } else {
                    self.onEdit([]);
                }
            });
    }

    Widget.prototype.show = function (container) {
        this.container = container;
        $(container).append(this.domElement);
        $('.widget-test-data', this.domElement).append(this.testDataManager.getDOM());
        this.widgetDnD = new WidgetDnD(this.domElement, this.domainObject.configuration.ruleOrder, this.rulesById);
        this.initRule('default', 'Default');
        this.refreshRules();
        this.updateWidget();

        this.addRuleButton.on('click', this.addRule);
        this.conditionManager.on('receiveTelemetry', this.executeRules);
        this.widgetDnD.on('drop', this.reorder);
    };

    Widget.prototype.destroy = function (container) {

    };

    Widget.prototype.onEdit = function (status) {
        if (status && status.includes('editing')) {
            this.editing = true;
        } else {
            this.editing = false;
        }
        this.updateView();
    };

    Widget.prototype.updateView = function () {
        if (this.editing) {
            this.ruleArea.show();
            this.testDataArea.show();
            this.addRuleButton.show();
        } else {
            this.ruleArea.hide();
            this.testDataArea.hide();
            this.addRuleButton.hide();
        }
    };

    Widget.prototype.executeRules = function () {
        this.activeId = this.conditionManager.executeRules(
            this.domainObject.configuration.ruleOrder,
            this.rulesById
        );
        this.updateWidget();
    };

    Widget.prototype.addRule = function () {
        var ruleCount = 0,
            ruleId,
            ruleOrder = this.domainObject.configuration.ruleOrder;

        //create a unique identifier
        while (Object.keys(this.rulesById).includes('rule' + ruleCount)) {
            ruleCount = ++ruleCount;
        }

        //add rule to config
        ruleId = 'rule' + ruleCount;
        ruleOrder.push(ruleId);
        this.domainObject.configuration.ruleOrder = ruleOrder;
        this.updateDomainObject();
        this.initRule(ruleId, 'Rule');
        this.refreshRules();
    };

    Widget.prototype.duplicateRule = function (sourceConfig) {
        var ruleCount = 0,
            ruleId,
            sourceRuleId = sourceConfig.id,
            ruleOrder = this.domainObject.configuration.ruleOrder,
            ruleIds = Object.keys(this.rulesById);

        //create a unique identifier
        while (ruleIds.includes('rule' + ruleCount)) {
            ruleCount = ++ruleCount;
        }

        // //add rule to config
        ruleId = 'rule' + ruleCount;
        sourceConfig.id = ruleId;
        sourceConfig.name += ' Copy';
        ruleOrder.splice(ruleOrder.indexOf(sourceRuleId) + 1, 0, ruleId);
        this.domainObject.configuration.ruleOrder = ruleOrder;
        this.domainObject.configuration.ruleConfigById[ruleId] = sourceConfig;
        this.updateDomainObject();
        this.initRule(ruleId, sourceConfig.name);
        this.refreshRules();
    };

    Widget.prototype.initRule = function (ruleId, ruleName) {
        var ruleConfig,
            styleObj = {};

        Object.assign(styleObj, DEFAULT_PROPS);
        if (!this.domainObject.configuration.ruleConfigById[ruleId]) {
            this.domainObject.configuration.ruleConfigById[ruleId] = {
                name: ruleName || 'Rule',
                label: this.domainObject.name,
                message: '',
                id: ruleId,
                icon: 'icon-alert-rect',
                style: styleObj,
                description: ruleId === 'default' ? 'Default appearance for the widget' : 'A new rule',
                conditions: [{
                    object: '',
                    key: '',
                    operation: '',
                    values: []
                }],
                trigger: 'any',
                expanded: 'true'
            };

        }
        ruleConfig = this.domainObject.configuration.ruleConfigById[ruleId];
        this.rulesById[ruleId] = new Rule(ruleConfig, this.domainObject, this.openmct,
                                          this.conditionManager, this.widgetDnD, this.container);
        this.rulesById[ruleId].on('remove', this.refreshRules);
        this.rulesById[ruleId].on('duplicate', this.duplicateRule);
        this.rulesById[ruleId].on('change', this.updateWidget);
        this.rulesById[ruleId].on('conditionChange', this.executeRules);
    };

    Widget.prototype.reorder = function (sourceId, targetId) {
        var ruleOrder = this.domainObject.configuration.ruleOrder,
            sourceIndex = ruleOrder.indexOf(sourceId),
            targetIndex;

        if (sourceId !== targetId) {
            ruleOrder.splice(sourceIndex, 1);
            targetIndex = ruleOrder.indexOf(targetId);
            ruleOrder.splice(targetIndex + 1, 0, sourceId);
            this.domainObject.configuration.ruleOrder = ruleOrder;
            this.updateDomainObject();
        }
        this.refreshRules();
    };

    Widget.prototype.refreshRules = function () {
        var self = this,
            ruleOrder = self.domainObject.configuration.ruleOrder,
            rules = self.rulesById;

        $('#ruleArea', self.domElement).html('');
        Object.values(ruleOrder).forEach(function (ruleId) {
            self.initRule(ruleId);
            $('#ruleArea', self.domElement).append(rules[ruleId].getDOM());
        });

        this.executeRules();
    };

    // Apply a list of css properties to an element
    // Arguments:
    // elem: the DOM element to which the rules will be applied
    // style: an object representing the style
    Widget.prototype.applyStyle = function (elem, style) {
        Object.keys(style).forEach(function (propId) {
            elem.css(propId, style[propId]);
        });
    };

    Widget.prototype.updateWidget = function () {
        var activeRule = this.rulesById[this.activeId];
        this.applyStyle($('#widget', this.domElement), activeRule.getProperty('style'));
        $('#widget', this.domElement).prop('title', activeRule.getProperty('message'));
        $('#widgetLabel', this.domElement).html(activeRule.getProperty('label'));
        $('#widgetIcon', this.domElement).removeClass().addClass(activeRule.getProperty('icon'));
    };

    Widget.prototype.updateDomainObject = function () {
        this.openmct.objects.mutate(this.domainObject, 'configuration', this.domainObject.configuration);
    };

    return Widget;
});
