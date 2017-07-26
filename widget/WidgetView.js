define(
    [
        'text!./widgetTemplate.html',
        'text!./ruleTemplate.html',
        'text!./conditionTemplate.html',
        'lodash'
    ], function (
        widgetTemplate,
        ruleTemplate,
        conditionTemplate,
        _
    ) {

    //default css configuration for new rules
    var DEFAULT_PROPS = {
        color: '#000000',
        background_color: '#00ff00',
        border_color: '#666666'
    }

    //selects that most be populated dynamically
    var CONDITION_CONFIG_IDS = [
        'object',
        'key',
        'operation'
    ];

    // example rules for the rule evalutor
    var TEST_RULES = [{
        object: undefined,
        property: undefined,
        operation: 'greaterThan',
        values: [8]
    },
    {
        object: undefined,
        property: undefined,
        operation: 'lessThan',
        values: [10]
    }]

    // parameters
    // domainObject: the domain object represented by this view
    // openmct: an MCT instance
    // evaluator: a RuleEvaluator instance for evaluating conditions
    function WidgetView(domainObject, openmct, evaluator) {
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.evaluator = evaluator;

        this.domainObject.configuration = this.domainObject.configuration || {};
        this.domainObject.configuration.rulesById = this.domainObject.configuration.rulesById || {};
        this.domainObject.configuration.ruleStylesById = this.domainObject.configuration.ruleStylesById || {};
        this.domainObject.configuration.ruleOrder = this.domainObject.configuration.ruleOrder || ['default'];

        this.activeId = 'default';
        var self = this;

        this.telemetryMetadataByObject = {};
        this.compositionObjs = {};
        this.compositionCollection = this.openmct.composition.get(this.domainObject);
        this.compositionCollection.on('add', this.onCompositionAdd, this);
        this.compositionCollection.load().then( function () {
            self.refreshRules();
        });

        //ensure 'this' points to an instance of this object when its methods
        //are called from a different scope
        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        this.populateSelect = this.populateSelect.bind(this);
        this.onCompositionAdd = this.onCompositionAdd.bind(this);
    }

    WidgetView.prototype.show = function (container) {
        var self = this;

        self.setup(container);

        $(container).on('click', '.t-icon-palette-menu-button, .t-color-palette-menu-button', function () {
            $('.menu', container)
                .not('#' + this.id +' .menu')
                .hide(); //close any open palettes except this one
            $('.menu', this).toggle(); //toggle this palette
        });

        $(container).on('click', '.t-color-palette-menu-button .s-palette-item', function () {
            var elem = this,
                col = $(elem).css('background-color'),
                ruleId = elem.dataset.ruleId,
                thumbnail = $('#' + ruleId + ' .t-widget-thumb'),
                propertyKey = elem.dataset.propertyKey,
                styleObj;

            self.setConfigProp('ruleStylesById.' + ruleId + '.'+ propertyKey, col);
            styleObj = self.getConfigProp('ruleStylesById.' + ruleId);
            self.applyStyle(thumbnail, styleObj);
            self.updateWidget();
            $('.color-swatch', '#' + ruleId + ' #' + propertyKey)
                .css('background-color', col); //update color indicator on palette
            $('.l-color-palette', '#' + ruleId).hide(); //close palette

        });

        $(container).on('click', '.t-icon-palette-menu-button .s-palette-item', function () {
            var elem = this,
                iconClass = elem.dataset.iconClass,
                ruleId = elem.dataset.ruleId,
                oldClass = self.getConfigProp('rulesById.' + ruleId + '.icon');

            self.setConfigProp('rulesById.' + ruleId + '.icon', iconClass);
            self.updateWidget();
            $('.icon-swatch', '#' + ruleId).removeClass(oldClass).addClass(iconClass);
            $('.menu', '#' + ruleId).hide();
        });

        $('#addRule', container).on('click', function () {
            self.addRule(container);
        });

        $(container).on('click','.t-duplicate', function () {
            var elem = this;
            self.duplicateRule(elem.dataset.ruleId, container);
        });

        $(container).on('input','#ruleName', function () {
            self.setConfigProp('rulesById.' + this.dataset.ruleId + '.name', this.value);
            $('#' + this.dataset.ruleId + ' .rule-title').html(this.value);
        });

        $(container).on('input', '#ruleLabel', function () {
            self.setConfigProp('rulesById.' + this.dataset.ruleId + '.label', this.value);
            self.updateWidget();
        });

        $(container).on('input', '#ruleMessage', function () {
            self.setConfigProp('rulesById.' + this.dataset.ruleId + '.message', this.value);
        });

        $(container).on('click','.t-delete', function() {
            var elem = this,
                ruleId = elem.dataset.ruleId,
                ruleOrder = self.getConfigProp('ruleOrder')

            self.removeConfigProp('rulesById.' + ruleId);
            self.removeConfigProp('ruleStylesById.' + ruleId);
            _.remove(ruleOrder, function (value) {
                return value === ruleId;
            });
            self.setConfigProp('ruleOrder', ruleOrder);
            self.refreshRules(container);
        })

        $(container).on('click', '.add-condition', function () {
            var elem = this,
                ruleId = elem.dataset.ruleId,
                conditions = self.getConfigProp('rulesById.' + ruleId + '.conditions'),
                conditionLabels = self.getConfigProp('rulesById.' + ruleId + '.conditionLabels');

            conditions.push({
                object: '',
                key: '',
                operation: '',
                values: []
            })

            conditionLabels.push({
              object: '',
              key: '',
              operation: '',
              values: []
            })

            self.setConfigProp('rulesById.' + ruleId + '.conditions', conditions);
            self.setConfigProp('rulesById.' + ruleId + '.conditionLabels', conditionLabels);

            self.refreshRules();
        });

        // populate a select with most recent composition before it opens
        $(container).on('mousedown', 'select', function () {
            self.populateSelect(this);
        });

        // update data model when a select element is modified
        $(container).on('change','select', function () {
            var elem = this,
                index = $(elem).prop('selectedIndex'),
                selectedOption = $(elem).prop('options')[index],
                selectedId = selectedOption.value,
                ruleId = elem.dataset.ruleId,
                conditionIndex = elem.dataset.conditionIndex,
                propId = $(elem).prop('id'),
                conditions = self.getConfigProp('rulesById.' + ruleId + '.conditions'),
                conditionLabels = self.getConfigProp('rulesById.' + ruleId + '.conditionLabels');

            conditions[conditionIndex][propId] = elem.value;
            conditionLabels[conditionIndex][propId] = $(selectedOption).html();
            elem.dataset.selectedId = selectedId;
            self.setConfigProp('rulesById.' + ruleId + '.conditions', conditions);
            self.setConfigProp('rulesById.' + ruleId + '.conditionLabels', conditionLabels);

            //refresh selects
            $('select', '#' + ruleId + ' #condition' + conditionIndex).each( function (index) {
                var element = this,
                    propKey = $(element).prop('id');
                self.populateSelect(this).then( function () {
                    var optionValues = Array.from($(element).prop('options')).map( function(option) {
                        return $(option).html();
                    });
                    if (!optionValues.includes(conditionLabels[conditionIndex][propKey])) {
                        conditions[conditionIndex][propKey] = '';
                        conditionLabels[conditionIndex][propKey] = '';
                    }
                    self.setConfigProp('rulesById.' + ruleId + '.conditions', conditions);
                    self.setConfigProp('rulesById.' + ruleId + '.conditionLabels', conditionLabels);
                })
            });

        });
    };

    WidgetView.prototype.destroy = function (container) {

    }

    WidgetView.prototype.setup = function (container) {
        var self = this;
        $(container).append(widgetTemplate);
        self.makeRule('default', 'Default', container);
        self.refreshRules(container);
        self.updateWidget();
    }

    WidgetView.prototype.onCompositionAdd = function (newObj) {
        var self = this,
            telemetryAPI = self.openmct.telemetry,
            telemetryMetadata;

        self.compositionObjs = self.compositionObjs || {};
        self.telemetryMetadataByObject = self.telemetryMetadataByObject || {};

        var telemetryMetadata;
        if (telemetryAPI.canProvideTelemetry(newObj)) {
            telemetryAPI.subscribe(newObj, self.subscriptionCallback, {});
            telemetryMetadata = telemetryAPI.getMetadata(newObj).values();
            self.compositionObjs[newObj.identifier.key] = newObj;
            self.telemetryMetadataByObject[newObj.identifier.key] = {};
            telemetryMetadata.forEach( function (metaDatum) {
                self.telemetryMetadataByObject[newObj.identifier.key][metaDatum.key] = metaDatum;
            });
            telemetryAPI.request(newObj, {}).then( function (telemetry) {
                Object.entries(telemetry[0]).forEach( function(telem) {
                    self.telemetryMetadataByObject[newObj.identifier.key][telem[0]]['type'] = typeof telem[1];
                });
            });
        }
    }

    WidgetView.prototype.refreshRules = function (container) {
        var self = this;
        $('#ruleArea').html('');
        self.getConfigProp('ruleOrder').forEach( function(ruleId) {
            self.makeRule(ruleId, self.getConfigProp('rulesById.' + ruleId + '.name'), container);
        })
    }

    WidgetView.prototype.makeRule = function (ruleId, ruleName, container) {
        //create a DOM element from HTML template and access its components
        var newRule = $(ruleTemplate),
            thumbnail = $('.t-widget-thumb', newRule),
            title = $('.rule-title' , newRule),
            description = $('.rule-description', newRule),
            nameInput = $('#ruleName', newRule),
            styleObj = {},
            ruleLabel,
            ruleDescription,
            ruleMessage,
            ruleIcon,
            ruleConditions,
            conditionLabels,
            self = this;

        Object.assign(styleObj, DEFAULT_PROPS)
        if (!self.hasConfigProp('ruleStylesById.' + ruleId)) {
            self.setConfigProp('ruleStylesById.' + ruleId, styleObj);
        } else {
            styleObj = self.getConfigProp('ruleStylesById.' + ruleId);
        }
        if (!self.hasConfigProp('rulesById.' + ruleId)) {
            self.setConfigProp('rulesById.' + ruleId, {
                name: ruleName,
                label: self.domainObject.name,
                message: '',
                id: ruleId,
                description: ruleId === 'default' ? 'Default appearance for the widget' : 'A new rule',
                conditions: [{
                    object: '',
                    key: '',
                    operation: '',
                    values: []
                }],
                conditionLabels: [{
                    object: '',
                    key: '',
                    operation: '',
                    values: ['']
                }],
                trigger: '',
                icon: 'icon-alert-rect'
            });
        }

        ruleDescription = self.getConfigProp('rulesById.' + ruleId + '.description');
        ruleLabel = self.getConfigProp('rulesById.' + ruleId + '.label');
        ruleMessage = self.getConfigProp('rulesById.' + ruleId + '.message');
        ruleIcon = self.getConfigProp('rulesById.' + ruleId + '.icon');
        ruleConditions = self.getConfigProp('rulesById.' + ruleId + '.conditions');
        conditionLabels = self.getConfigProp('rulesById.' + ruleId + '.conditionLabels')

        //append it to the document
        $('#ruleArea', container).append(newRule);

        //configure new rule's default properties
        self.setConfigProp('ruleStylesById.' + ruleId, styleObj);
        newRule.prop('id', ruleId);
        title.html(ruleName);
        description.html(ruleDescription);
        self.applyStyle(thumbnail, styleObj);

        // configure icon inputs
        self.initIconPalette( $('.t-icon-palette-menu-button', newRule) );
        $('.menu', newRule).hide();
        $('.t-icon-palette-menu-button .icon-swatch', newRule).addClass(ruleIcon);
        $('.t-icon-palette-menu-button .s-palette-item', newRule).each( function () {
            this.dataset.ruleId = ruleId;
        });

        //configure color inputs
        self.initColorPalette( $('.t-color-palette-menu-button', newRule) );
        $('.menu', newRule).hide();
        $('.t-color-palette-menu-button', newRule).each( function () {
            var propertyKey = this.dataset.propertyKey;
            $('.color-swatch', this).css('background-color', styleObj[propertyKey]);
            $('.s-palette-item', this).each( function() {
                this.dataset.ruleId = ruleId;
                this.dataset.propertyKey = propertyKey;
            });
        });

        //configure text inputs
        $(nameInput).get(0).dataset.ruleId = ruleId;
        $(nameInput).prop('value', ruleName);
        $('#ruleLabel', newRule).get(0).dataset.ruleId = ruleId;
        $('#ruleLabel', newRule).prop('value', ruleLabel);
        $('#ruleMessage', newRule).get(0).dataset.ruleId = ruleId;
        $('#ruleMessage', newRule).prop('value', ruleMessage);

        self.initCondititions(newRule, ruleConditions, conditionLabels);

        // configure conditions
        self.getConfigProp('rulesById.' + ruleId + '.conditions').forEach( function (condition) {
            Object.entries(condition).forEach( function (property) {
                var options = $('select', newRule).has('#' + property[0]);
            })
        })

        //configure delete
        $('.t-delete', newRule).get(0).dataset.ruleId = ruleId;

        $('.t-duplicate', newRule).get(0).dataset.ruleId = ruleId;

        $('.add-condition', newRule).get(0).dataset.ruleId = ruleId;

        //hide elements that don't apply to default
        if (ruleId === 'default') {
            $('.t-delete', ruleArea).hide();
            $('.t-widget-rule-config', ruleArea).hide();
            $('.t-grippy', ruleArea).hide();
        }
    }

    WidgetView.prototype.initCondititions = function(rule, conditions, labels) {
        var condition;
        conditions.forEach( function (condition, index) {
            condition = $(conditionTemplate);
            $('.t-widget-rule-config li:last-of-type', rule).before(condition);
            $(condition).prop('id', 'condition' + index);
            $('select', condition).each(function() {
                this.dataset.conditionIndex = index;
            });
        });

        $('select', rule).each( function () {
            var propId = $(this).prop('id'),
                elem = this,
                selectedId
                ruleId = $(rule).prop('id');

            if (CONDITION_CONFIG_IDS.includes(propId)) {
                selectedId = conditions[elem.dataset.conditionIndex][propId];
                elem.dataset.ruleId = ruleId;
                elem.dataset.selectedId = selectedId;
                if (labels[elem.dataset.conditionIndex][propId] != '') {
                    $(elem).append(
                      '<option value = ' + selectedId + ' selected>'
                      + labels[elem.dataset.conditionIndex][propId] + '</option>'
                    )
                } else {
                    $(elem).append('<option value = "" selected>' +  '--' +
                        _.capitalize($(elem).prop('id')) + '--' +'</option>');
                }
                $(elem).prop('selectedIndex', 0);
            }
        });
    }

    //Convert object property id to css property name
    WidgetView.prototype.getPropName = function (propString) {
        return propString.replace('_', '-');
    }

    // Apply a list of css properties to an element
    // Arguments:
    // elem: the DOM element to which the rules will be applied
    // style: an object representing the style
    WidgetView.prototype.applyStyle = function(elem, style) {
        var self = this;
        Object.keys(style).forEach( function (propId) {
            elem.css(self.getPropName(propId), style[propId])
        });
    }

    WidgetView.prototype.updateWidget = function() {
        this.executeRules();
        this.applyStyle( $('#widget'), this.getConfigProp('ruleStylesById.' + this.activeId));
        $('#widgetName').html(this.getConfigProp('rulesById.' + this.activeId + '.label'));
        $('#widgetIcon').removeClass().addClass(this.getConfigProp('rulesById.' + this.activeId + '.icon'));
    }

    WidgetView.prototype.executeRules = function () {
        var self = this;
            rules = Object.entries(self.getConfigProp('rulesById'));
            showRuleId = 'default';

        rules = rules.filter( function (rule) {
            return (self.getConfigProp('ruleOrder').includes(rule[0]))
        });

        rules.forEach( function (rule) {
            if(self.evaluator.execute(rule[1].conditions)) {
                showRuleId = rule[0];
            }
        });

        this.activeId = showRuleId;
    }

    WidgetView.prototype.subscriptionCallback = function(datum) {
        //do some telemetry stuff
    }

    WidgetView.prototype.initColorPalette = function(elem) {
        var paletteTemplate = `
            <span class="l-click-area"></span>
            <span class="color-swatch"></span>
            <div class="menu l-palette l-color-palette">
                <div class="l-palette-row l-option-row">
                    <div class="l-palette-item s-palette-item"></div>
                    <span class="l-palette-item-label">None</span>
                </div>
            </div>
        `,
        colors = [
            '#ff0000',
            '#00ff00',
            '#0000ff',
            '#ffff00',
            '#ff00ff',
            '#00ffff',
            '#000000',
            '#333333',
            '#666666',
            '#999999',
            '#cccccc',
            '#ffffff'
        ],
        maxItems = 10,
        itemCount = 1;

        elem.html(paletteTemplate);

        colors.forEach(function (color) {
            if (itemCount === 1) {
                $('.menu', elem).append(
                    '<div class = "l-palette-row"> </div>'
                )
            }
            $('.l-palette-row:last-of-type', elem).append(
              '<div class = "l-palette-item s-palette-item" style="background-color:' + color + '"> </div>'
            )
            itemCount = itemCount < maxItems ? ++itemCount : 1;
        });
    }

    WidgetView.prototype.initIconPalette = function(elem) {
        var paletteTemplate = `
        <span class="l-click-area"></span>
        <span class="icon-swatch"></span>
        <div class="menu l-palette l-icon-palette">
            <div class="l-palette-row l-option-row">
                <div class="l-palette-item s-palette-item"></div>
                <span class="l-palette-item-label">None</span>
            </div>
        </div>
    `,
            icons = [
                'icon-alert-rect',
                'icon-alert-triangle',
                'icon-arrow-down',
                'icon-arrow-left',
                'icon-arrow-right',
                'icon-arrow-double-up',
                'icon-arrow-tall-up',
                'icon-arrow-tall-down',
                'icon-arrow-double-down',
                'icon-arrow-up',
                'icon-asterisk',
                'icon-bell',
                'icon-check',
                'icon-eye-open',
                'icon-gear',
                'icon-hourglass',
                'icon-info',
                'icon-link',
                'icon-lock',
                'icon-people',
                'icon-person',
                'icon-plus',
                'icon-trash',
                'icon-x'
            ],
            maxItems = icons.length,
            itemCount = 1;

        elem.html(paletteTemplate);

        icons.forEach(function (icon) {
            if (itemCount === 1) {
                $('.menu', elem).append(
                    '<div class = "l-palette-row"> </div>'
                )
            }
            $('.l-palette-row:last-of-type', elem).append(
                '<div class="l-palette-item s-palette-item ' + icon + '"' +
                ' data-icon-class="' + icon + '"> </div>'
            )
            itemCount = itemCount < maxItems ? ++itemCount : 1;
        });
    }

    WidgetView.prototype.addRule = function (container) {
        var self = this,
            ruleCount = 0,
            ruleId,
            ruleOrder = self.getConfigProp('ruleOrder');

        //create a unique identifier
        while (Object.keys(self.getConfigProp('rulesById')).includes('rule' + ruleCount)) {
            ruleCount = ++ruleCount;
        }
        //add rule to config
        ruleId = 'rule' + ruleCount;
        ruleOrder.push(ruleId);
        self.setConfigProp('ruleOrder', ruleOrder);
        self.makeRule(ruleId, 'Rule', container);
    }

    WidgetView.prototype.duplicateRule = function (sourceRuleId, container) {
        var self = this,
            ruleCount = 0,
            ruleId,
            ruleOrder = self.getConfigProp('ruleOrder'),
            sourceRule = {},
            sourceStyle = {};

        // copy source object configuration by value
        Object.assign(sourceRule, self.getConfigProp('rulesById.' + sourceRuleId));
        Object.assign(sourceStyle, self.getConfigProp('ruleStylesById.' + sourceRuleId));

        //create a unique identifier
        while (Object.keys(self.getConfigProp('rulesById')).includes('rule' + ruleCount)) {
            ruleCount = ++ruleCount;
        }

        //add rule to config
        ruleId = 'rule' + ruleCount;
        sourceRule.id = ruleId;
        sourceRule.name += ' Copy';
        ruleOrder.splice(ruleOrder.indexOf(sourceRuleId)+1, 0, ruleId);
        self.setConfigProp('ruleOrder', ruleOrder);
        self.setConfigProp('rulesById.' + ruleId, sourceRule);
        self.setConfigProp('ruleStylesById.' + ruleId, sourceStyle)
        self.makeRule(ruleId, sourceRule.name, container);
        self.refreshRules(container);
    }

    //populate a select with elements
    WidgetView.prototype.populateSelect = function (elem) {
        var id = $(elem).prop('id'),
            self = this,
            promise;

        promise = new Promise( function(resolve, reject) {
            if (CONDITION_CONFIG_IDS.includes(id)) {
                var ruleId = elem.dataset.ruleId,
                    conditionIndex = elem.dataset.conditionIndex,
                    selectedId,
                    selectedStr,
                    objInput = $('#object', '#'+ruleId+' #condition'+conditionIndex),
                    objId = objInput.get(0).dataset.selectedId || '',
                    keyInput = $('#key', '#'+ruleId+' #condition'+conditionIndex),
                    keyId = keyInput.get(0).dataset.selectedId || '';

                $('option', elem).each( function () {
                    if ($(this).prop('selected')) {
                        selectedId = $(this).prop('value')
                    }
                });


                $(elem).html('');
                $(elem).append('<option value = "">' +  '--'+ _.capitalize($(elem).prop('id')) + '--' +'</option>');


                if (id === 'object') {
                    $(elem).append('<option value = "any"' + (selectedId === 'any' ? 'selected' : '') + '> Any Telemetry Item </option>' +
                                 '<option value = "all"' + (selectedId === 'all' ? 'selected' : '') +'> All Telemetry Items </option>');
                    Object.values(self.compositionObjs).forEach( function (obj) {
                        selectedStr = (obj.identifier.key === selectedId) ? 'selected' : '';
                        $(elem).append(
                            '<option value = ' + obj.identifier.key + ' ' + selectedStr + '>'
                            + obj.name + '</option>'
                        );
                    });
                    resolve();
                } else if (id === 'key') {
                    var metaData;
                    if (objId && self.telemetryMetadataByObject[objId]) {
                        metaData = Object.values(self.telemetryMetadataByObject[objId]);
                        metaData.forEach( function (metaDatum) {
                            selectedStr = (metaDatum.key === selectedId) ? 'selected' : '';
                            $(elem).append(
                                '<option value = ' + metaDatum.key + ' ' + selectedStr + '>'
                                + metaDatum.name + '</option>'
                            )
                        });
                    }
                    resolve();
                } else if (id === 'operation') {
                    if (objId && keyId && self.telemetryMetadataByObject[objId] && self.telemetryMetadataByObject[objId][keyId]) {
                        var type = self.telemetryMetadataByObject[objId][keyId]['type']
                            operationKeys = self.evaluator.getOperationKeys().filter( function (opKey) {
                                return (self.evaluator.operationAppliesTo(opKey, type));
                            })
                        operationKeys.forEach( function (key) {
                            var selectedStr = (key === selectedId) ? 'selected' : '';
                            $(elem).append(
                                '<option value = ' + key + ' ' + selectedStr + '>'
                                + self.evaluator.getOperationText(key) + '</option>'
                            );
                        });
                    }
                    resolve();
                }
            }
        });
        return promise;
    }

    //load and parse the type of a telemetry object and cache it for future use.
    //returns a promise resolving to the type
    WidgetView.prototype.getPropertyType = function (domainObject, key) {
        var self = this,
            telemetryAPI = this.openmct.telemetry,
            type = '',
            objId = domainObject.identifier.key,
            promise = new Promise(function (resolve, reject) {
                if (self.telemetryMetadataByObject[objId][key]['type']) {
                    resolve(self.telemetryMetadataByObject[objId][key]['type'])
                }
                telemetryAPI.request(domainObject, {}).then( function (telemetry) {
                    Object.entries(telemetry[0]).forEach( function(telem) {
                        if (telem[0] === key){
                            type = typeof telem[1];
                            self.telemetryMetadataByObject[objId][telem[0]]['type'] = type;
                            resolve(type);
                        }
                    });
                });
        });
        return promise;
    }

    WidgetView.prototype.getConfigProp = function (path) {
        return _.get(this.domainObject.configuration, path);
    }

    WidgetView.prototype.setConfigProp = function(path, value) {
        this.openmct.objects.mutate(this.domainObject, 'configuration.' + path, value);
        return this.getConfigProp(path);
    }

    WidgetView.prototype.hasConfigProp = function (path) {
        return _.has(this.domainObject.configuration, path)
    }

    WidgetView.prototype.removeConfigProp = function(path) {
        var config = this.domainObject.configuration;
        _.set(config, path, undefined);
        this.openmct.objects.mutate(this.domainObject, 'configuration', config)
    }

    return WidgetView;
});
