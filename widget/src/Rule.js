define(
  [
      'text!../res/ruleTemplate.html',
      './Condition',
      './input/ColorPalette',
      './input/IconPalette',
      'lodash'
  ],
  function (
      ruleTemplate,
      Condition,
      ColorPalette,
      IconPalette,
      _
  ) {

    function Rule(ruleConfig, domainObject, openmct, selectManager) {
        this.config = ruleConfig;
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.selectManager = selectManager;

        this.domElement = $(ruleTemplate);
        this.conditions = [];

        this.onColorInput = this.onColorInput.bind(this);
        this.onIconInput = this.onIconInput.bind(this);
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
        this.conditionArea = $('.t-widget-rule-config', this.domElement);
        this.deleteButton = $('.t-delete', this.domElement);
        this.duplicateButton = $('.t-duplicate', this.domElement);
        this.addConditionButton = $('.add-condition', this.domElement);

        this.textInputs = {
            name: $('.t-rule-name-input', this.domElement),
            label: $('.t-rule-label-input', this.domElement),
            message: $('.t-rule-message-input', this.domElement)
        }

        this.iconInput = new IconPalette('');

        this.colorInputs = {
            'background-color': new ColorPalette('background-color', 'icon-paint-bucket'),
            'border-color': new ColorPalette('border-color', 'icon-line-horz'),
            'color': new ColorPalette('color', 'icon-T')
        }

        this.callbacks = {
            remove: $.noop,
            duplicate: $.noop,
            change: $.noop
        }

        this.init();
    }

    Rule.prototype.init = function () {
        var self = this;

        $('.t-rule-label-input', this.domElement).before(this.iconInput.getDOM());
        this.iconInput.setIcon(self.config.icon);
        this.iconInput.on('change', this.onIconInput);

        Object.keys(this.colorInputs).forEach( function (inputKey) {
            var input = self.colorInputs[inputKey];
            input.on('change', self.onColorInput);
            input.setColor(self.config.style[inputKey]);
            $('.t-style-input', self.domElement).append(input.getDOM());
        });

        Object.keys(this.textInputs).forEach( function (inputKey) {
            self.textInputs[inputKey].prop('value', self.config[inputKey]);
            self.textInputs[inputKey].on('input', function () {
                var elem = this;
                self.config[inputKey] = elem.value;
                self.updateDomainObject(inputKey, elem.value)
                if (inputKey === 'name') {
                    self.title.html(elem.value);
                }
                self.callbacks['change'] && self.callbacks['change']();
            });
        });

        this.deleteButton.on('click', this.remove);
        this.duplicateButton.on('click', this.duplicate);
        this.addConditionButton.on('click', this.addCondition);

        this.title.html(self.config.name);
        this.description.html(self.config.description);

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
    }

    Rule.prototype.on = function (event, callback) {
        if(this.callbacks[event]) {
            this.callbacks[event] = callback;
        }
    }

    Rule.prototype.onIconInput = function (icon) {
        this.icon = icon;
        this.updateDomainObject('icon', icon);
        this.callbacks['change'] && this.callbacks['change']();
    }

    Rule.prototype.onColorInput = function (color, property) {
        this.config.style[property] = color;
        this.updateDomainObject('style.' + property, color)
        this.thumbnail.css(property, color);
        this.callbacks['change'] && this.callbacks['change']();
    }

    Rule.prototype.onConditionChange = function (value, property, index) {
        this.config.conditions[index][property] = value[0];
        this.config.conditionLabels[index][property] = value[1];
        this.updateDomainObject('conditions[' + index + '].' + property, value[0]);
        this.updateDomainObject('conditionLabels[' + index + '].'+ property, value[1]);
        this.callbacks['change'] && this.callbacks['change']();
    }

    Rule.prototype.updateDomainObject = function (property, value) {
        this.openmct.objects.mutate(this.domainObject, 'configuration.ruleConfigById.' +
            this.config.id + '.' + property, value);
    }

    Rule.prototype.getProperty = function (prop) {
        return this.config[prop];
    }

    Rule.prototype.remove = function () {
        var ruleOrder = this.domainObject.configuration.ruleOrder,
            ruleConfigById = this.domainObject.configuration.ruleConfigById,
            self = this;

        delete ruleConfigById[self.config.id];
        _.remove(ruleOrder, function (ruleId) {
            return ruleId === self.config.id;
        });
        self.openmct.objects.mutate(this.domainObject, 'configuration.ruleConfigById', ruleConfigById);
        self.openmct.objects.mutate(this.domainObject, 'configuration.ruleOrder', ruleOrder);

        this.callbacks['remove'] && this.callbacks['remove']();

        delete this;
    }

    //makes a deep copy of this rule's configuration, and calls the duplicate event
    //callback with the copy as an argument if one has been registered
    Rule.prototype.duplicate = function () {
        var sourceRule = JSON.parse(JSON.stringify(this.config));
        this.callbacks['duplicate'] && this.callbacks['duplicate'](sourceRule);
    }

    Rule.prototype.addCondition = function () {
        this.initCondition();
    }

    Rule.prototype.initCondition = function (sourceConfig, sourceLabels) {
        var ruleConfigById = this.domainObject.configuration.ruleConfigById,
            newConfig,
            defaultConfig = {
                object: '',
                key: '',
                operation: '',
                values: []
            },
            defaultLabels = {
                object: '',
                key: '',
                operation: '',
                values: ['']
            }

        newConfig = sourceConfig || defaultConfig;
        newLabels = sourceLabels || defaultLabels;
        ruleConfigById[this.config.id].conditions.push(newConfig);
        ruleConfigById[this.config.id].conditionLabels.push(newLabels);
        this.openmct.objects.mutate(this.domainObject, 'configuration.ruleConfigById', ruleConfigById);
        this.refreshConditions();
    }

    Rule.prototype.refreshConditions = function () {
        var self = this;

        self.conditions = [];
        $('.t-condition', this.domElement).remove();

        this.config.conditions.forEach( function (condition, index) {
            var newCondition = new Condition(condition, index, self.selectManager);
            newCondition.on('remove', self.removeCondition);
            newCondition.on('duplicate', self.addCondition);
            newCondition.on('change', self.onConditionChange);
            self.conditions.push(newCondition);
        });

        self.conditions.forEach( function (condition) {
            $('li:last-of-type', self.conditionArea).before(condition.getDOM());
        });

        if (self.conditions.length === 1) {
            self.conditions[0].hideButtons();
        }
    }

    Rule.prototype.removeCondition = function (removeIndex) {
      var ruleConfigById = this.domainObject.configuration.ruleConfigById,
          conditions = ruleConfigById[this.config.id].conditions,
          conditionLabels = ruleConfigById[this.config.id].conditionLabels;

      _.remove(conditions, function (condition, index) {
          return index === removeIndex;
      });
      _.remove(conditionLabels, function (condition, index) {
          return index === removeIndex;
      });

      this.openmct.objects.mutate(this.domainObject, 'configuration.ruleConfigById', ruleConfigById);
      this.refreshConditions();
    }

    return Rule;
});
