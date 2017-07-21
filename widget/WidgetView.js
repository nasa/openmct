define(
    [
        'text!./widgetTemplate.html',
        'text!./ruleTemplate.html',
        'lodash'
    ], function (
        widgetTemplate,
        ruleTemplate,
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
    // evaluator: a RuleEvaluator instance for evaluating rulesets
    function WidgetView(domainObject, openmct, evaluator) {
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.evaluator = evaluator;

        this.domainObject.configuration = this.domainObject.configuration || {};
        this.domainObject.configuration.rulesById = this.domainObject.configuration.rulesById || {};
        this.domainObject.configuration.ruleStylesById = this.domainObject.configuration.ruleStylesById || {};
        this.domainObject.configuration.ruleOrder = this.domainObject.configuration.ruleOrder || ['default'];

        var self = this;

        this.telemetryMetadataByObject = {};
        this.compositionObjs = {};
        this.compositionCollection = this.openmct.composition.get(this.domainObject);
        this.compositionCollection.on('add', this.onCompositionAdd, this);
        this.compositionCollection.load();

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

          $(container).on('click', '.t-color-palette', function () {
              $('.l-color-palette', container)
                  .not('#' + this.id +' .l-color-palette')
                  .hide(); //close any open palettes except this one
              $('.l-color-palette', this).toggle(); //toggle this palette
          });

          $(container).on('click', '.s-palette-item', function () {
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
          })

          $('#addRule', container).on('click', function () {
              var ruleCount = 0,
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
          });

          $(container).on('click','.t-duplicate', function () {
              var elem = this;
              debugger;
              self.duplicateRule(elem.dataset.ruleId, container);
          });

          $(container).on('input','#ruleName', function () {
              self.setConfigProp('rulesById.' + this.dataset.ruleId + '.name', this.value);
              $('#' + this.dataset.ruleId + ' .rule-title').html(this.value);
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

          // populate a select with most recent composition before it opens
          $(container).on('mousedown', 'select', this.populateSelect);

          // update data model when a select element is modified
          $(container).on('change','select', function () {
              var elem = this,
                  index = $(elem).prop('selectedIndex'),
                  selectedId = $(elem).prop('options')[index].value,
                  ruleId = elem.dataset.ruleId;

              this.dataset.selectedId = selectedId;
          });
    }

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
            ruleMessage;

        Object.assign(styleObj, DEFAULT_PROPS)
        if (!this.hasConfigProp('ruleStylesById.' + ruleId)) {
            this.setConfigProp('ruleStylesById.' + ruleId, styleObj);
        } else {
            styleObj = this.getConfigProp('ruleStylesById.' + ruleId);
        }
        if (!this.hasConfigProp('rulesById.' + ruleId)) {
            this.setConfigProp('rulesById.' + ruleId, {
                name: ruleName,
                label: this.domainObject.name,
                message: '',
                id: ruleId,
                description: ruleId === 'default' ? 'Default appearance for the widget' : 'A new rule',
                conditions: [],
                trigger: ''
              });
        }

        ruleDescription = this.getConfigProp('rulesById.' + ruleId + '.description');
        ruleLabel = this.getConfigProp('rulesById.' + ruleId + '.label');
        ruleMessage = this.getConfigProp('rulesById.' + ruleId + '.message');

        //append it to the document
        $('#ruleArea', container).append(newRule);

        //configure new rule's default properties
        this.setConfigProp('ruleStylesById.' + ruleId, styleObj);
        newRule.prop('id', ruleId);
        title.html(ruleName);
        description.html(ruleDescription);
        this.applyStyle(thumbnail, styleObj);

        //configure color inputs
        this.initColorPalette( $('.t-color-palette', newRule) );
        $('.l-color-palette', newRule).hide();
        $('.t-color-palette', newRule).each( function () {
            var propertyKey = this.dataset.propertyKey;
            $('.color-swatch', this).css('background-color', styleObj[propertyKey])
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

        //configure select inputs
        $('select', newRule).each( function () {
            if (CONDITION_CONFIG_IDS.includes($(this).prop('id'))) {
                this.dataset.ruleId = ruleId;
                $(this).append('<option value = "">' +
                  '--' + _.capitalize($(this).prop('id')) + '--' +'</option>');
            }
        });

        //configure delete
        $('.t-delete', newRule).get(0).dataset.ruleId = ruleId;

        $('.t-duplicate', newRule).get(0).dataset.ruleId = ruleId;

        //hide elements that don't apply to default
        if (ruleId === 'default') {
            $('.t-delete', ruleArea).hide();
            $('.t-widget-rule-config').hide();
            $('.t-grippy').hide();
        }
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
        var self = this;
            rules = Object.entries(self.getConfigProp('rulesById'));
            showRuleId = 'default';

        rules = rules.filter( function (rule) {
            return (self.getConfigProp('ruleOrder').includes(rule.id))
        });

        rules.forEach( function (rule) {
            if(self.evaluator.execute(rule[1].conditions)) {
                showRuleId = rule[0];
            }
        });

        this.applyStyle( $('#widget'), this.getConfigProp('ruleStylesById.' + showRuleId));
        $('#widgetName').html(this.getConfigProp('rulesById.' + showRuleId + '.label'));
    }

    WidgetView.prototype.subscriptionCallback = function(datum) {
        //do some telemetry stuff
    }

    WidgetView.prototype.initColorPalette = function(elem) {
        var paletteTemplate = `
            <span class="l-click-area"></span>
            <span class="color-swatch"></span>
            <div class="menu l-color-palette">
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
      sourceRule.name += ' Copy'
      ruleOrder.splice(ruleOrder.indexOf(sourceRuleId)+1, 0, ruleId);
      self.setConfigProp('ruleOrder', ruleOrder);
      self.setConfigProp('rulesById.' + ruleId, sourceRule);
      self.setConfigProp('ruleStylesById.' + ruleId, sourceStyle)
      self.makeRule(ruleId, sourceRule.name, container);
      self.refreshRules(container);
    }

    WidgetView.prototype.populateSelect = function (elem) {
        var elem = elem.toElement,
            id = $(elem).prop('id');

        if (CONDITION_CONFIG_IDS.includes(id)) {
                var self = this,
                ruleId = elem.dataset.ruleId,
                selectedId,
                selectedStr,
                objInput = $('#object', '#'+ruleId),
                objId = objInput.get(0).dataset.selectedId || '',
                keyInput = $('#key', '#'+ruleId),
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
            } else if (id === 'key') {
                var metaData;
                if (objId && objId !== '') {
                    metaData = Object.values(self.telemetryMetadataByObject[objId]);
                    metaData.forEach( function (metaDatum) {
                        selectedStr = (metaDatum.key === selectedId) ? 'selected' : '';
                        $(elem).append(
                            '<option value = ' + metaDatum.key + ' ' + selectedStr + '>'
                            + metaDatum.name + '</option>'
                        )
                    });
                }
            } else if (id === 'operation') {
                if (objId && objId != '' && keyId && keyId !== '') {
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
            }
        }
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
