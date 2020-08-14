define([
    '../res/ruleTemplate.html',
    './Condition',
    './input/ColorPalette',
    './input/IconPalette',
    './eventHelpers',
    'EventEmitter',
    'lodash',
    'zepto'
], function (
    ruleTemplate,
    Condition,
    ColorPalette,
    IconPalette,
    eventHelpers,
    EventEmitter,
    _,
    $
) {
    /**
     * An object representing a summary widget rule. Maintains a set of text
     * and css properties for output, and a set of conditions for configuring
     * when the rule will be applied to the summary widget.
     * @constructor
     * @param {Object} ruleConfig A JavaScript object representing the configuration of this rule
     * @param {Object} domainObject The Summary Widget domain object which contains this rule
     * @param {MCT} openmct An MCT instance
     * @param {ConditionManager} conditionManager A ConditionManager instance
     * @param {WidgetDnD} widgetDnD A WidgetDnD instance to handle dragging and dropping rules
     * @param {element} container The DOM element which cotains this summary widget
     */
    function Rule(ruleConfig, domainObject, openmct, conditionManager, widgetDnD, container) {
        eventHelpers.extend(this);
        const self = this;
        const THUMB_ICON_CLASS = 'c-sw__icon js-sw__icon';

        this.config = ruleConfig;
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.conditionManager = conditionManager;
        this.widgetDnD = widgetDnD;
        this.container = container;

        this.domElement = $(ruleTemplate);
        this.eventEmitter = new EventEmitter();
        this.supportedCallbacks = ['remove', 'duplicate', 'change', 'conditionChange'];
        this.conditions = [];
        this.dragging = false;

        this.remove = this.remove.bind(this);
        this.duplicate = this.duplicate.bind(this);

        this.thumbnail = $('.t-widget-thumb', this.domElement);
        this.thumbnailIcon = $('.js-sw__icon', this.domElement);
        this.thumbnailLabel = $('.c-sw__label', this.domElement);
        this.title = $('.rule-title', this.domElement);
        this.description = $('.rule-description', this.domElement);
        this.trigger = $('.t-trigger', this.domElement);
        this.toggleConfigButton = $('.js-disclosure', this.domElement);
        this.configArea = $('.widget-rule-content', this.domElement);
        this.grippy = $('.t-grippy', this.domElement);
        this.conditionArea = $('.t-widget-rule-config', this.domElement);
        this.jsConditionArea = $('.t-rule-js-condition-input-holder', this.domElement);
        this.deleteButton = $('.t-delete', this.domElement);
        this.duplicateButton = $('.t-duplicate', this.domElement);
        this.addConditionButton = $('.add-condition', this.domElement);

        /**
         * The text inputs for this rule: any input included in this object will
         * have the appropriate event handlers registered to it, and it's corresponding
         * field in the domain object will be updated with its value
         */
        this.textInputs = {
            name: $('.t-rule-name-input', this.domElement),
            label: $('.t-rule-label-input', this.domElement),
            message: $('.t-rule-message-input', this.domElement),
            jsCondition: $('.t-rule-js-condition-input', this.domElement)
        };

        this.iconInput = new IconPalette('', container);
        this.colorInputs = {
            'background-color': new ColorPalette('icon-paint-bucket', container),
            'border-color': new ColorPalette('icon-line-horz', container),
            'color': new ColorPalette('icon-font', container)
        };

        this.colorInputs.color.toggleNullOption();

        /**
         * An onchange event handler method for this rule's icon palettes
         * @param {string} icon The css class name corresponding to this icon
         * @private
         */
        function onIconInput(icon) {
            self.config.icon = icon;
            self.updateDomainObject('icon', icon);
            self.thumbnailIcon.removeClass().addClass(THUMB_ICON_CLASS + ' ' + icon);
            self.eventEmitter.emit('change');
        }

        /**
         * An onchange event handler method for this rule's color palettes palettes
         * @param {string} color The color selected in the palette
         * @param {string} property The css property which this color corresponds to
         * @private
         */
        function onColorInput(color, property) {
            self.config.style[property] = color;
            self.thumbnail.css(property, color);
            self.eventEmitter.emit('change');
        }

        /**
         * Parse input text from textbox to prevent HTML Injection
         * @param {string} msg The text to be Parsed
         * @private
         */
        function encodeMsg(msg) {
            return $('<div />').text(msg).html();
        }

        /**
         * An onchange event handler method for this rule's trigger key
         * @param {event} event The change event from this rule's select element
         * @private
         */
        function onTriggerInput(event) {
            const elem = event.target;
            self.config.trigger = encodeMsg(elem.value);
            self.generateDescription();
            self.updateDomainObject();
            self.refreshConditions();
            self.eventEmitter.emit('conditionChange');
        }

        /**
         * An onchange event handler method for this rule's text inputs
         * @param {element} elem The input element that generated the event
         * @param {string} inputKey The field of this rule's configuration to update
         * @private
         */
        function onTextInput(elem, inputKey) {
            const text = encodeMsg(elem.value);
            self.config[inputKey] = text;
            self.updateDomainObject();
            if (inputKey === 'name') {
                self.title.html(text);
            } else if (inputKey === 'label') {
                self.thumbnailLabel.html(text);
            }

            self.eventEmitter.emit('change');
        }

        /**
         * An onchange event handler for a mousedown event that initiates a drag gesture
         * @param {event} event A mouseup event that was registered on this rule's grippy
         * @private
         */
        function onDragStart(event) {
            $('.t-drag-indicator').each(function () {
                // eslint-disable-next-line no-invalid-this
                $(this).html($('.widget-rule-header', self.domElement).clone().get(0));
            });
            self.widgetDnD.setDragImage($('.widget-rule-header', self.domElement).clone().get(0));
            self.widgetDnD.dragStart(self.config.id);
            self.domElement.hide();
        }

        /**
         * Show or hide this rule's configuration properties
         * @private
         */
        function toggleConfig() {
            self.configArea.toggleClass('expanded');
            self.toggleConfigButton.toggleClass('c-disclosure-triangle--expanded');
            self.config.expanded = !self.config.expanded;
        }

        $('.t-rule-label-input', this.domElement).before(this.iconInput.getDOM());
        this.iconInput.set(self.config.icon);
        this.iconInput.on('change', function (value) {
            onIconInput(value);
        });

        // Initialize thumbs when first loading
        this.thumbnailIcon.removeClass().addClass(THUMB_ICON_CLASS + ' ' + self.config.icon);
        this.thumbnailLabel.html(self.config.label);

        Object.keys(this.colorInputs).forEach(function (inputKey) {
            const input = self.colorInputs[inputKey];

            input.set(self.config.style[inputKey]);
            onColorInput(self.config.style[inputKey], inputKey);

            input.on('change', function (value) {
                onColorInput(value, inputKey);
                self.updateDomainObject();
            });

            $('.t-style-input', self.domElement).append(input.getDOM());
        });

        Object.keys(this.textInputs).forEach(function (inputKey) {
            self.textInputs[inputKey].prop('value', self.config[inputKey] || '');
            self.listenTo(self.textInputs[inputKey], 'input', function () {
                // eslint-disable-next-line no-invalid-this
                onTextInput(this, inputKey);
            });
        });

        this.listenTo(this.deleteButton, 'click', this.remove);
        this.listenTo(this.duplicateButton, 'click', this.duplicate);
        this.listenTo(this.addConditionButton, 'click', function () {
            self.initCondition();
        });
        this.listenTo(this.toggleConfigButton, 'click', toggleConfig);
        this.listenTo(this.trigger, 'change', onTriggerInput);

        this.title.html(self.config.name);
        this.description.html(self.config.description);
        this.trigger.prop('value', self.config.trigger);

        this.listenTo(this.grippy, 'mousedown', onDragStart);
        this.widgetDnD.on('drop', function () {
            // eslint-disable-next-line no-invalid-this
            this.domElement.show();
            $('.t-drag-indicator').hide();
        }, this);

        if (!this.conditionManager.loadCompleted()) {
            this.config.expanded = false;
        }

        if (!this.config.expanded) {
            this.configArea.removeClass('expanded');
            this.toggleConfigButton.removeClass('c-disclosure-triangle--expanded');
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

    /**
     * Return the DOM element representing this rule
     * @return {Element} A DOM element
     */
    Rule.prototype.getDOM = function () {
        return this.domElement;
    };

    /**
     * Unregister any event handlers registered with external sources
     */
    Rule.prototype.destroy = function () {
        Object.values(this.colorInputs).forEach(function (palette) {
            palette.destroy();
        });
        this.iconInput.destroy();
        this.stopListening();
        this.conditions.forEach(function (condition) {
            condition.destroy();
        });
    };

    /**
     * Register a callback with this rule: supported callbacks are remove, change,
     * conditionChange, and duplicate
     * @param {string} event The key for the event to listen to
     * @param {function} callback The function that this rule will envoke on this event
     * @param {Object} context A reference to a scope to use as the context for
     *                         context for the callback function
     */
    Rule.prototype.on = function (event, callback, context) {
        if (this.supportedCallbacks.includes(event)) {
            this.eventEmitter.on(event, callback, context || this);
        }
    };

    /**
     * An event handler for when a condition's configuration is modified
     * @param {} value
     * @param {string} property The path in the configuration to updateDomainObject
     * @param {number} index The index of the condition that initiated this change
     */
    Rule.prototype.onConditionChange = function (event) {
        _.set(this.config.conditions[event.index], event.property, event.value);
        this.generateDescription();
        this.updateDomainObject();
        this.eventEmitter.emit('conditionChange');
    };

    /**
     * During a rule drag event, show the placeholder element after this rule
     */
    Rule.prototype.showDragIndicator = function () {
        $('.t-drag-indicator').hide();
        $('.t-drag-indicator', this.domElement).show();
    };

    /**
     * Mutate thet domain object with this rule's local configuration
     */
    Rule.prototype.updateDomainObject = function () {
        this.openmct.objects.mutate(this.domainObject, 'configuration.ruleConfigById.'
            + this.config.id, this.config);
    };

    /**
     * Get a property of this rule by key
     * @param {string} prop They property key of this rule to get
     * @return {} The queried property
     */
    Rule.prototype.getProperty = function (prop) {
        return this.config[prop];
    };

    /**
     * Remove this rule from the domain object's configuration and invoke any
     * registered remove callbacks
     */
    Rule.prototype.remove = function () {
        const ruleOrder = this.domainObject.configuration.ruleOrder;
        const ruleConfigById = this.domainObject.configuration.ruleConfigById;
        const self = this;

        ruleConfigById[self.config.id] = undefined;
        _.remove(ruleOrder, function (ruleId) {
            return ruleId === self.config.id;
        });

        this.openmct.objects.mutate(this.domainObject, 'configuration.ruleConfigById', ruleConfigById);
        this.openmct.objects.mutate(this.domainObject, 'configuration.ruleOrder', ruleOrder);
        this.destroy();
        this.eventEmitter.emit('remove');
    };

    /**
     * Makes a deep clone of this rule's configuration, and calls the duplicate event
     * callback with the cloned configuration as an argument if one has been registered
     */
    Rule.prototype.duplicate = function () {
        const sourceRule = JSON.parse(JSON.stringify(this.config));
        sourceRule.expanded = true;
        this.eventEmitter.emit('duplicate', sourceRule);
    };

    /**
     * Initialze a new condition. If called with the sourceConfig and sourceIndex arguments,
     * will insert a new condition with the provided configuration after the sourceIndex
     * index. Otherwise, initializes a new blank rule and inserts it at the end
     * of the list.
     * @param {Object} [config] The configuration to initialize this rule from,
     *                          consisting of sourceCondition and index fields
     */
    Rule.prototype.initCondition = function (config) {
        const ruleConfigById = this.domainObject.configuration.ruleConfigById;
        let newConfig;
        const sourceIndex = config && config.index;
        const defaultConfig = {
            object: '',
            key: '',
            operation: '',
            values: []
        };

        newConfig = (config !== undefined ? config.sourceCondition : defaultConfig);
        if (sourceIndex !== undefined) {
            ruleConfigById[this.config.id].conditions.splice(sourceIndex + 1, 0, newConfig);
        } else {
            ruleConfigById[this.config.id].conditions.push(newConfig);
        }

        this.domainObject.configuration.ruleConfigById = ruleConfigById;
        this.updateDomainObject();
        this.refreshConditions();
        this.generateDescription();
    };

    /**
     * Build {Condition} objects from configuration and rebuild associated view
     */
    Rule.prototype.refreshConditions = function () {
        const self = this;
        let $condition = null;
        let loopCnt = 0;
        const triggerContextStr = self.config.trigger === 'any' ? ' or ' : ' and ';

        self.conditions = [];
        $('.t-condition', this.domElement).remove();

        this.config.conditions.forEach(function (condition, index) {
            const newCondition = new Condition(condition, index, self.conditionManager);
            newCondition.on('remove', self.removeCondition, self);
            newCondition.on('duplicate', self.initCondition, self);
            newCondition.on('change', self.onConditionChange, self);
            self.conditions.push(newCondition);
        });

        if (this.config.trigger === 'js') {
            this.jsConditionArea.show();
            this.addConditionButton.hide();
        } else {
            this.jsConditionArea.hide();
            this.addConditionButton.show();
            self.conditions.forEach(function (condition) {
                $condition = condition.getDOM();
                $('li:last-of-type', self.conditionArea).before($condition);
                if (loopCnt > 0) {
                    $('.t-condition-context', $condition).html(triggerContextStr + ' when');
                }

                loopCnt++;
            });
        }

        if (self.conditions.length === 1) {
            self.conditions[0].hideButtons();
        }

    };

    /**
     * Remove a condition from this rule's configuration at the given index
     * @param {number} removeIndex The index of the condition to remove
     */
    Rule.prototype.removeCondition = function (removeIndex) {
        const ruleConfigById = this.domainObject.configuration.ruleConfigById;
        const conditions = ruleConfigById[this.config.id].conditions;

        _.remove(conditions, function (condition, index) {
            return index === removeIndex;
        });

        this.domainObject.configuration.ruleConfigById[this.config.id] = this.config;
        this.updateDomainObject();
        this.refreshConditions();
        this.generateDescription();
        this.eventEmitter.emit('conditionChange');
    };

    /**
     * Build a human-readable description from this rule's conditions
     */
    Rule.prototype.generateDescription = function () {
        let description = '';
        const manager = this.conditionManager;
        const evaluator = manager.getEvaluator();
        let name;
        let property;
        let operation;
        const self = this;

        if (this.config.conditions && this.config.id !== 'default') {
            if (self.config.trigger === 'js') {
                description = 'when a custom JavaScript condition evaluates to true';
            } else {
                this.config.conditions.forEach(function (condition, index) {
                    name = manager.getObjectName(condition.object);
                    property = manager.getTelemetryPropertyName(condition.object, condition.key);
                    operation = evaluator.getOperationDescription(condition.operation, condition.values);
                    if (name || property || operation) {
                        description += 'when '
                            + (name ? name + '\'s ' : '')
                            + (property ? property + ' ' : '')
                            + (operation ? operation + ' ' : '')
                            + (self.config.trigger === 'any' ? ' OR ' : ' AND ');
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
    };

    return Rule;
});
