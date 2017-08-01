define(
    [
      'text!../res/conditionTemplate.html',
      './input/Select',
      './input/ObjectSelect',
      './input/KeySelect',
      './input/OperationSelect'
    ],
    function (
        conditionTemplate,
        Select,
        ObjectSelect,
        KeySelect,
        OperationSelect
    ) {

    function Condition(conditionConfig, index, conditionManager) {
        this.config = conditionConfig;
        this.index = index;
        this.conditionManager = conditionManager;

        this.domElement = $(conditionTemplate);

        this.deleteButton = $('.t-delete', this.domElement);
        this.duplicateButton = $('.t-duplicate', this.domElement)

        this.callbacks = {
            remove: $.noop,
            duplicate: $.noop,
            change: $.noop
        }

        this.selects = {}

        this.remove = this.remove.bind(this);
        this.duplicate = this.duplicate.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);

        this.init();
    }

    Condition.prototype.init = function () {
        var self = this;
        this.deleteButton.on('click', this.remove);
        this.duplicateButton.on('click', this.duplicate);

        this.selects.object = new ObjectSelect(this.config, this.conditionManager),
        this.selects.key = new KeySelect(this.config, this.selects.object, this.conditionManager),
        this.selects.operation = new OperationSelect(this.config, this.selects.key, this.conditionManager)

        Object.values(this.selects).forEach( function(select) {
            $('.t-configuration', self.domElement).append(select.getDOM());
            select.on('change', self.onSelectChange);
        })
    }

    Condition.prototype.getDOM = function (container) {
        return this.domElement;
    }

    Condition.prototype.on = function (event, callback) {
        if(this.callbacks[event]) {
            this.callbacks[event] = callback;
        }
    }

    Condition.prototype.hideButtons = function() {
        this.deleteButton.hide();
    }

    Condition.prototype.remove = function () {
      this.callbacks['remove'] && this.callbacks['remove'](this.index);
      delete this;
    }

    Condition.prototype.duplicate = function () {
        var sourceCondition = JSON.parse(JSON.stringify(this.config));
        this.callbacks['duplicate'] && this.callbacks['duplicate'](sourceCondition);
    }

    Condition.prototype.onSelectChange = function (value, property) {
        this.callbacks['change'] && this.callbacks['change'](value, property, this.index);
    }

    return Condition;
});
