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
    function Widget(domainObject, openmct) {
        this.domainObject = domainObject;
        this.openmct = openmct;

        this.domainObject.configuration = this.domainObject.configuration || {};
        this.domainObject.configuration.ruleConfigById = this.domainObject.configuration.ruleConfigById || {};
        this.domainObject.configuration.ruleOrder = this.domainObject.configuration.ruleOrder || ['default'];

        this.activeId = 'default';
        this.rulesById = {};
        this.conditionManager = new ConditionManager(this.domainObject, this.openmct);
        this.domElement = $(widgetTemplate);
        this.dragImage = $('.t-drag-rule-image', this.domElement);
        this.draggingId = '';
        this.draggingRulePrevious = '';

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        this.addRule = this.addRule.bind(this);
        this.refreshRules = this.refreshRules.bind(this);
        this.duplicateRule = this.duplicateRule.bind(this);
        this.updateWidget = this.updateWidget.bind(this);
        this.onReceiveTelemetry = this.onReceiveTelemetry.bind(this);
        this.reorder = this.reorder.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    Widget.prototype.show = function (container) {
        $(container).append(this.domElement);

        this.initRule('default', 'Default');
        this.refreshRules();
        this.updateWidget();

        $('#addRule').on('click', this.addRule);
        this.conditionManager.on('receiveTelemetry', this.onReceiveTelemetry);

        this.domElement.on('mousemove', this.onDrag);
        $(document).on('mouseup', this.onDrop);
    };

    Widget.prototype.destroy = function (container) {

    };

    Widget.prototype.getDropLocation = function (event) {
        var ruleOrder = this.domainObject.configuration.ruleOrder,
            rulesById = this.rulesById,
            draggingId = this.draggingId,
            offset,
            y,
            height,
            dropY = event.pageY,
            target = '';

        ruleOrder.forEach(function (ruleId, index) {
            offset = rulesById[ruleId].getDOM().offset();
            y = offset.top;
            height = offset.height;
            if (index === 0) {
                if (dropY < y + 3 * height / 2) {
                    target = ruleId;
                }
            } else if (index === ruleOrder.length - 1 && ruleId !== draggingId) {
                if (y + height / 4 < dropY) {
                    target = ruleId;
                }
            } else {
                if (y + height / 4 < dropY && dropY < y + 3 * height / 2) {
                    target = ruleId;
                }
            }
        });
        return target;
    };

    Widget.prototype.onDragStart = function (ruleId) {
        var ruleOrder = this.domainObject.configuration.ruleOrder;
        this.draggingId = ruleId;
        this.draggingRulePrevious = ruleOrder[ruleOrder.indexOf(ruleId) - 1];
        this.rulesById[this.draggingRulePrevious].showDragIndicator();
        $('.t-drag-rule-image').show();
        this.dragImage.offset({
            top: event.pageY - this.dragImage.height() / 2,
            left: event.pageX - $('.t-grippy', this.dragImage).width()
        });
    };

    Widget.prototype.onDrag = function (event) {
        var dragTarget;
        if (this.draggingId && this.draggingId !== '') {
            event.preventDefault();
            dragTarget = this.getDropLocation(event);
            this.dragImage.offset({
                top: event.pageY - this.dragImage.height() / 2,
                left: event.pageX - $('.t-grippy', this.dragImage).width()
            });
            if (this.rulesById[dragTarget]) {
                this.rulesById[dragTarget].showDragIndicator();
            } else {
                $('.t-drag-indicator').hide();
                this.rulesById[this.draggingRulePrevious].showDragIndicator();
            }
        }
    };

    Widget.prototype.onDrop = function (event) {
        var dropTarget = this.getDropLocation(event);

        if (this.draggingId && this.draggingId !== '') {
            if (this.rulesById[dropTarget]) {
                this.reorder(this.draggingId, dropTarget);
            } else {
                this.reorder(this.draggingId, this.draggingId);
            }
            this.draggingId = '';
            this.draggingRulePrevious = '';
            $('.t-drag-rule-image').hide();
        }
    };

    Widget.prototype.onReceiveTelemetry = function () {
        this.activeId = this.conditionManager.executeRules(
            this.domainObject.configuration.ruleOrder,
            this.rulesById
        );
        this.updateWidget();
    };

    Widget.prototype.addRule = function () {
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

    Widget.prototype.duplicateRule = function (sourceConfig) {
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

    Widget.prototype.initRule = function (ruleId, ruleName) {
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
        this.rulesById[ruleId].on('dragStart', this.onDragStart);
    };

    Widget.prototype.reorder = function (sourceId, targetId) {
        var ruleOrder = this.domainObject.configuration.ruleOrder,
            sourceIndex = ruleOrder.indexOf(sourceId),
            targetIndex;

        if (sourceId !== targetId) {
            ruleOrder.splice(sourceIndex, 1);
            targetIndex = ruleOrder.indexOf(targetId);
            ruleOrder.splice(targetIndex + 1, 0, sourceId);
            this.setConfigProp('ruleOrder', ruleOrder);
        }
        this.refreshRules();
    };

    Widget.prototype.refreshRules = function () {
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

    Widget.prototype.getConfigProp = function (path) {
        return _.get(this.domainObject.configuration, path);
    };

    Widget.prototype.setConfigProp = function (path, value) {
        this.openmct.objects.mutate(this.domainObject, 'configuration.' + path, value);
        return this.getConfigProp(path);
    };

    Widget.prototype.hasConfigProp = function (path) {
        return _.has(this.domainObject.configuration, path);
    };

    Widget.prototype.removeConfigProp = function (path) {
        var config = this.domainObject.configuration;
        _.set(config, path, undefined);
        this.openmct.objects.mutate(this.domainObject, 'configuration', config);
    };

    return Widget;
});
