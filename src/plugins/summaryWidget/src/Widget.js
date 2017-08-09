define([
    'text!../res/widgetTemplate.html',
    './Rule',
    './ConditionManager',
    'lodash',
    'zepto'
], function (
    widgetTemplate,
    Rule,
    ConditionManager,
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
    function WidgetView(domainObject, openmct) {
        this.domainObject = domainObject;
        this.openmct = openmct;

        this.domainObject.configuration = this.domainObject.configuration || {};
        this.domainObject.configuration.ruleConfigById = this.domainObject.configuration.ruleConfigById || {};
        this.domainObject.configuration.ruleOrder = this.domainObject.configuration.ruleOrder || ['default'];

        this.activeId = 'default';
        this.rulesById = {};
        this.conditionManager = new ConditionManager(this.domainObject, this.openmct);
        this.domElement = $(widgetTemplate);

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        this.addRule = this.addRule.bind(this);
        this.refreshRules = this.refreshRules.bind(this);
        this.duplicateRule = this.duplicateRule.bind(this);
        this.updateWidget = this.updateWidget.bind(this);
        this.onReceiveTelemetry = this.onReceiveTelemetry.bind(this);
    }

    WidgetView.prototype.show = function (container) {
        $(container).append(this.domElement);
        this.initRule('default', 'Default');
        this.refreshRules();
        this.updateWidget();

        $('#addRule').on('click', this.addRule);
        this.conditionManager.on('receiveTelemetry', this.onReceiveTelemetry);
    };

    WidgetView.prototype.destroy = function (container) {

    };

    WidgetView.prototype.onReceiveTelemetry = function () {
        this.activeId = this.conditionManager.executeRules(
            this.domainObject.configuration.ruleOrder,
            this.rulesById
        );
        this.updateWidget();
    };

    WidgetView.prototype.addRule = function () {
        var self = this,
            ruleCount = 0,
            ruleId,
            ruleOrder = self.getConfigProp('ruleOrder');

        //create a unique identifier
        while (Object.keys(self.rulesById).includes('rule' + ruleCount)) {
            ruleCount = ++ruleCount;
        }

        //add rule to config
        ruleId = 'rule' + ruleCount;
        ruleOrder.push(ruleId);
        self.setConfigProp('ruleOrder', ruleOrder);
        self.initRule(ruleId, 'Rule');
        self.refreshRules();
    };

    WidgetView.prototype.duplicateRule = function (sourceConfig) {
        var self = this,
            ruleCount = 0,
            ruleId,
            sourceRuleId = sourceConfig.id,
            ruleOrder = self.getConfigProp('ruleOrder'),
            ruleIds = Object.keys(self.rulesById);

        //create a unique identifier
        while (ruleIds.includes('rule' + ruleCount)) {
            ruleCount = ++ruleCount;
        }

        // //add rule to config
        ruleId = 'rule' + ruleCount;
        sourceConfig.id = ruleId;
        sourceConfig.name += ' Copy';
        ruleOrder.splice(ruleOrder.indexOf(sourceRuleId) + 1, 0, ruleId);
        self.setConfigProp('ruleOrder', ruleOrder);
        self.setConfigProp('ruleConfigById.' + ruleId, sourceConfig);
        self.initRule(ruleId, sourceConfig.name);
        self.refreshRules();
    };

    WidgetView.prototype.initRule = function (ruleId, ruleName) {
        var ruleConfig,
            styleObj = {};

        Object.assign(styleObj, DEFAULT_PROPS);
        if (!this.hasConfigProp('ruleConfigById.' + ruleId)) {
            ruleConfig = this.setConfigProp('ruleConfigById.' + ruleId, {
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
            });
        } else {
            ruleConfig = this.getConfigProp('ruleConfigById.' + ruleId);
        }
        this.rulesById[ruleId] = new Rule(ruleConfig, this.domainObject, this.openmct, this.conditionManager);
        this.rulesById[ruleId].on('remove', this.refreshRules);
        this.rulesById[ruleId].on('duplicate', this.duplicateRule);
        this.rulesById[ruleId].on('change', this.updateWidget);
    };

    WidgetView.prototype.refreshRules = function () {
        var self = this,
            ruleOrder = self.getConfigProp('ruleOrder'),
            rules = self.rulesById;

        $('#ruleArea', this.domElement).html('');
        Object.values(ruleOrder).forEach(function (ruleId) {
            self.initRule(ruleId);
            $('#ruleArea', self.domElement).append(rules[ruleId].getDOM());
        });
    };

    // Apply a list of css properties to an element
    // Arguments:
    // elem: the DOM element to which the rules will be applied
    // style: an object representing the style
    WidgetView.prototype.applyStyle = function (elem, style) {
        Object.keys(style).forEach(function (propId) {
            elem.css(propId, style[propId]);
        });
    };

    WidgetView.prototype.updateWidget = function () {
        var activeRule = this.rulesById[this.activeId];
        this.applyStyle($('#widget', this.domElement), activeRule.getProperty('style'));
        $('#widget', this.domElement).prop('title', activeRule.getProperty('message'));
        $('#widgetLabel', this.domElement).html(activeRule.getProperty('label'));
        $('#widgetIcon', this.domElement).removeClass().addClass(activeRule.getProperty('icon'));
    };

    WidgetView.prototype.getConfigProp = function (path) {
        return _.get(this.domainObject.configuration, path);
    };

    WidgetView.prototype.setConfigProp = function (path, value) {
        this.openmct.objects.mutate(this.domainObject, 'configuration.' + path, value);
        return this.getConfigProp(path);
    };

    WidgetView.prototype.hasConfigProp = function (path) {
        return _.has(this.domainObject.configuration, path);
    };

    WidgetView.prototype.removeConfigProp = function (path) {
        var config = this.domainObject.configuration;
        _.set(config, path, undefined);
        this.openmct.objects.mutate(this.domainObject, 'configuration', config);
    };

    return WidgetView;
});
