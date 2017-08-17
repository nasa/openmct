define([
    'text!../res/ruleTemplate.html',
    './Condition',
    './input/ColorPalette',
    './input/IconPalette',
    'lodash',
    'zepto'
], function (
    ruleTemplate,
    Condition,
    ColorPalette,
    IconPalette,
    _,
    $
) {

    // a module representing a summary widget rule. Maintains a set of text
    // and css properties for output, and a set of conditions for configuring
    // when the rule will be applied to the summary widget.
    // parameters:
    // ruleConfig: a JavaScript representing the configuration of this rule
    // domainObject: the Summary Widget domain object
    // openmct: an MCT instance
    // conditionManager: a ConditionManager instance
    function Rule(ruleConfig, domainObject, openmct, conditionManager, widgetDnD, container) {
        var self = this;

        this.config = ruleConfig;
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.conditionManager = conditionManager;
        this.widgetDnD = widgetDnD;
        this.container = container;

        this.domElement = $(ruleTemplate);
        this.conditions = [];
        this.dragging = false;

        this.remove = this.remove.bind(this);
        this.duplicate = this.duplicate.bind(this);
        this.addCondition = this.addCondition.bind(this);
        this.initCondition = this.initCondition.bind(this);
        this.removeCondition = this.removeCondition.bind(this);
        this.refreshConditions = this.refreshConditions.bind(this);
        this.onConditionChange = this.onConditionChange.bind(this);

        this.thumbnail = $('.t-widget-thumb', this.domElement);
        this.title = $('.rule-title', this.domElement);
        this.description = $('.rule-description', this.domElement);
        this.trigger = $('.t-trigger', this.domElement);
        this.toggleConfigButton = $('.view-control', this.domElement);
        this.configArea = $('.widget-rule-content', this.domElement);
        this.grippy = $('.t-grippy', this.domElement);
        this.conditionArea = $('.t-widget-rule-config', this.domElement);
        this.deleteButton = $('.t-delete', this.domElement);
        this.duplicateButton = $('.t-duplicate', this.domElement);
        this.addConditionButton = $('.add-condition', this.domElement);

        this.textInputs = {
            name: $('.t-rule-name-input', this.domElement),
            label: $('.t-rule-label-input', this.domElement),
            message: $('.t-rule-message-input', this.domElement)
        };

        this.iconInput = new IconPalette('icon', '', container);

        this.colorInputs = {
            'background-color': new ColorPalette('background-color', 'icon-paint-bucket', container),
            'border-color': new ColorPalette('border-color', 'icon-line-horz', container),
            'color': new ColorPalette('color', 'icon-T', container)
        };

        //hide the 'none' option for the text color palette
        this.colorInputs.color.toggleNullOption();

        this.callbacks = {
            remove: [],
            duplicate: [],
            change: [],
            conditionChange: []
        };

        function onIconInput(icon) {
            self.config.icon = icon;
            self.updateDomainObject();
            self.callbacks.change.forEach(function (callback) {
                if (callback) {
                    callback();
                }
            });
        }

        function onColorInput(color, property) {
            self.config.style[property] = color;
            self.updateDomainObject();
            self.thumbnail.css(property, color);
            self.callbacks.change.forEach(function (callback) {
                if (callback) {
                    callback();
                }
            });
        }

        function onTriggerInput(event) {
            var elem = event.target;
            self.config.trigger = elem.value;
            self.generateDescription();
            self.updateDomainObject();
            self.callbacks.conditionChange.forEach(function (callback) {
                if (callback) {
                    callback();
                }
            });
        }

        function toggleConfig() {
            self.configArea.toggleClass('expanded');
            self.toggleConfigButton.toggleClass('expanded');
            self.config.expanded = !self.config.expanded;
        }

        function onTextInput(elem, inputKey) {
            self.config[inputKey] = elem.value;
            self.updateDomainObject();
            if (inputKey === 'name') {
                self.title.html(elem.value);
            }
            self.callbacks.change.forEach(function (callback) {
                if (callback) {
                    callback();
                }
            });
        }

        function onDragStart(event) {
            $('.t-drag-indicator').each(function () {
                $(this).html($('.widget-rule-header', self.domElement).clone().get(0));
            });
            self.widgetDnD.setDragImage($('.widget-rule-header', self.domElement).clone().get(0));
            self.widgetDnD.dragStart(self.config.id);
            self.domElement.hide();
        }

        $('.t-rule-label-input', this.domElement).before(this.iconInput.getDOM());
        this.iconInput.set(self.config.icon);
        this.iconInput.on('change', onIconInput);

        Object.keys(this.colorInputs).forEach(function (inputKey) {
            var input = self.colorInputs[inputKey];
            input.on('change', onColorInput);
            input.set(self.config.style[inputKey]);
            $('.t-style-input', self.domElement).append(input.getDOM());
        });

        Object.keys(this.textInputs).forEach(function (inputKey) {
            self.textInputs[inputKey].prop('value', self.config[inputKey]);
            self.textInputs[inputKey].on('input', function () {
                onTextInput(this, inputKey);
            });
        });

        this.deleteButton.on('click', this.remove);
        this.duplicateButton.on('click', this.duplicate);
        this.addConditionButton.on('click', this.addCondition);
        this.toggleConfigButton.on('click', toggleConfig);
        this.trigger.on('change', onTriggerInput);

        this.title.html(self.config.name);
        this.description.html(self.config.description);
        this.trigger.prop('value', self.config.trigger);

        this.grippy.on('mousedown', onDragStart);

        if (!this.conditionManager.loadCompleted()) {
            this.config.expanded = false;
        }

        if (!this.config.expanded) {
            this.configArea.removeClass('expanded');
            this.toggleConfigButton.removeClass('expanded');
        }

        if (this.domainObject.configuration.ruleOrder.length === 2) {
            $('.t-grippy', this.domElement).hide();
        }

        this.refreshConditions();

        //if this is the default rule, hide elements that don't apply
        if (this.config.id === 'default') {
            $('.t-delete', this.domElement).hide();
            $('.t-widget-rule-config', this.domElement).hide();
            $('.t-grippy', this.domElement).hide();
        }
    }

    Rule.prototype.getDOM = function () {
        return this.domElement;
    };

    Rule.prototype.on = function (event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    };

    Rule.prototype.onConditionChange = function (value, property, index) {
        _.set(this.config.conditions[index], property, value);
        this.generateDescription();
        this.updateDomainObject();
        this.callbacks.conditionChange.forEach(function (callback) {
            if (callback) {
                callback();
            }
        });
    };

    Rule.prototype.showDragIndicator = function () {
        $('.t-drag-indicator').hide();
        $('.t-drag-indicator', this.domElement).show();
    };

    Rule.prototype.updateDomainObject = function () {
        this.openmct.objects.mutate(this.domainObject, 'configuration.ruleConfigById.' +
            this.config.id, this.config);
    };

    Rule.prototype.getProperty = function (prop) {
        return this.config[prop];
    };

    Rule.prototype.remove = function () {
        var ruleOrder = this.domainObject.configuration.ruleOrder,
            ruleConfigById = this.domainObject.configuration.ruleConfigById,
            self = this;

        ruleConfigById[self.config.id] = undefined;
        _.remove(ruleOrder, function (ruleId) {
            return ruleId === self.config.id;
        });

        this.domainObject.configuration.ruleConfigById = ruleConfigById;
        this.domainObject.configuration.ruleOrder = ruleOrder;
        this.updateDomainObject();

        self.callbacks.remove.forEach(function (callback) {
            if (callback) {
                callback();
            }
        });
    };

    //makes a deep copy of this rule's configuration, and calls the duplicate event
    //callback with the copy as an argument if one has been registered
    Rule.prototype.duplicate = function () {
        var sourceRule = JSON.parse(JSON.stringify(this.config)),
            self = this;
        sourceRule.expanded = true;
        self.callbacks.duplicate.forEach(function (callback) {
            if (callback) {
                callback(sourceRule);
            }
        });
    };

    Rule.prototype.addCondition = function () {
        this.initCondition();
    };

    Rule.prototype.initCondition = function (sourceConfig, sourceIndex) {
        var ruleConfigById = this.domainObject.configuration.ruleConfigById,
            newConfig,
            defaultConfig = {
                object: '',
                key: '',
                operation: '',
                values: []
            };

        newConfig = sourceConfig || defaultConfig;
        if (sourceIndex !== undefined) {
            ruleConfigById[this.config.id].conditions.splice(sourceIndex + 1, 0, newConfig);
        } else {
            ruleConfigById[this.config.id].conditions.push(newConfig);
        }
        this.domainObject.configuration.ruleConfigById = ruleConfigById;
        this.updateDomainObject();
        this.refreshConditions();
    };

    Rule.prototype.refreshConditions = function () {
        var self = this;

        self.conditions = [];
        $('.t-condition', this.domElement).remove();

        this.config.conditions.forEach(function (condition, index) {
            var newCondition = new Condition(condition, index, self.conditionManager);
            newCondition.on('remove', self.removeCondition);
            newCondition.on('duplicate', self.initCondition);
            newCondition.on('change', self.onConditionChange);
            self.conditions.push(newCondition);
        });

        self.conditions.forEach(function (condition) {
            $('li:last-of-type', self.conditionArea).before(condition.getDOM());
        });

        if (self.conditions.length === 1) {
            self.conditions[0].hideButtons();
        }

        self.generateDescription();
    };

    Rule.prototype.removeCondition = function (removeIndex) {
        var ruleConfigById = this.domainObject.configuration.ruleConfigById,
            conditions = ruleConfigById[this.config.id].conditions;

        _.remove(conditions, function (condition, index) {
            return index === removeIndex;
        });

        this.domainObject.configuration.ruleConfigById[this.config.id] = this.config;
        this.updateDomainObject();
        this.refreshConditions();

        this.callbacks.conditionChange.forEach(function (callback) {
            if (callback) {
                callback();
            }
        });
    };

    Rule.prototype.generateDescription = function () {
        var description = '',
            manager = this.conditionManager,
            evaluator = manager.getEvaluator(),
            name,
            property,
            operation,
            self = this;

        if (this.config.conditions && this.config.id !== 'default') {
            if (self.config.trigger === 'js') {
                description = 'when a custom JavaScript condition evaluates to true';
            } else {
                this.config.conditions.forEach(function (condition, index) {
                    name = manager.getObjectName(condition.object);
                    property = manager.getTelemetryPropertyName(condition.object, condition.key);
                    operation = evaluator.getOperationDescription(condition.operation, condition.values);
                    if (name || property || operation) {
                        description += 'when ' +
                            (name ? name + '\'s ' : '') +
                            (property ? property + ' ' : '') +
                            (operation ? operation + ' ' : '') +
                            (self.config.trigger === 'any' ? ' OR ' : ' AND ');
                    }
                });
            }
        }

        if (description.endsWith('OR ')) {
            description = description.substring(0, description.length - 3);
        }
        if (description.endsWith('AND ')) {
            description = description.substring(0, description.length - 4);
        }
        description = (description === '' ? this.config.description : description);
        this.description.html(description);
        this.config.description = description;
        this.updateDomainObject();
    };

    return Rule;
});
