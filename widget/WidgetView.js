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
        this.domainObject.configuration.ruleCount = this.domainObject.configuration.ruleCount || 0;

        var self = this;

        Object.keys(this.getConfigProp('rulesById')).forEach( function (ruleKey) {
            self.setConfigProp('rulesById.' + ruleKey + '.rules', TEST_RULES);
        });

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

          //register event listeners
          $(container).on('click', '.rule-header', function () {
              $('.rule-content', $(this).parent()).toggle();
          });

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
                  thumbnail = $('#' + ruleId + ' .thumbnail'),
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
              self.makeRule('rule' + self.getConfigProp('ruleCount'), 'Rule', container);
          });

          $(container).on('input','#ruleName', function() {
              self.setConfigProp('rulesById.'+ this.dataset.ruleId + '.name', this.value);
              $('#' + this.dataset.ruleId + ' .title').html(this.value);
          });

          // populate a select with most recent composition before it opens
          $(container).on('mousedown','select', this.populateSelect);

          // update data model when a select element is modified
          $(container).on('change','select', function () {
              var index = $(this).prop('selectedIndex'),
                  selectedId = $(this).prop('options')[index].value;

              this.dataset.selectedId = selectedId;
          });
    }

    WidgetView.prototype.destroy = function (container) {

    }

    WidgetView.prototype.setup = function (container) {
        var self = this;
        $(container).append(widgetTemplate);
        self.makeRule('default', 'Default', container);
        self.applyStyle( $('#widget'), self.getConfigProp('ruleStylesById.default'));
        $('#widgetName').html(self.domainObject.name);
        (Object.keys(self.getConfigProp('rulesById')) || []).forEach( function(ruleId) {
            if (ruleId !== 'default') {
                self.makeRule(ruleId, self.getConfigProp('rulesById.' + ruleId + '.name'), container);
            }
        });
        $('select').each( function() {
            $(this).append('<option value = "">' +
              '--' + _.capitalize($(this).prop('id')) + '--' +'</option>');
        });

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

    WidgetView.prototype.makeRule = function (ruleId, ruleName, container) {
        //create a DOM element from HTML template and access its components
        var newRule = $(ruleTemplate),
            thumbnail = $('.rule-header .thumbnail', newRule),
            title = $('.rule-header .title' , newRule),
            nameInput = $('#ruleName', newRule),
            styleObj;

        if (!this.hasConfigProp('ruleStylesById.' + ruleId)) {
            styleObj = this.setConfigProp('ruleStylesById.' + ruleId, DEFAULT_PROPS);
        } else {
            styleObj = this.getConfigProp('ruleStylesById.' + ruleId);
        }
        if (!this.hasConfigProp('rulesById.' + ruleId)) {
            this.setConfigProp('rulesById.' + ruleId, {id: ruleId, name: ruleName});
        }
        //append it to the document
        $('#ruleArea', container).append(newRule);

        //configure new rule's default properties
        this.setConfigProp('ruleStylesById.'+ ruleId, styleObj);
        newRule.prop('id', ruleId);
        title.html(ruleName);
        this.applyStyle(thumbnail, styleObj);
        this.setConfigProp('ruleCount', this.getConfigProp('ruleCount') + 1);

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

        //configure select inputs
        $('select', newRule).each( function () {
            this.dataset.ruleId = ruleId;
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
        var rules = Object.values(this.getConfigProp('rulesById')),
            showRuleId = this.evaluator.execute(rules);

        this.applyStyle( $('#widget'), this.getConfigProp('ruleStylesById.'+showRuleId));
    }

    WidgetView.prototype.subscriptionCallback = function(datum) {
        //do some telemetry stuff
    }

    WidgetView.prototype.initColorPalette = function(elem) {
        var paletteTemplate = `
            <span class="l-click-area"></span>
            <span class="color-swatch" style="background: rgb(255, 0, 0);"></span>
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

    WidgetView.prototype.populateSelect = function (elem) {
        //this refers to DOM element being populated
        var elem = elem.toElement,
            self = this,
            id = $(elem).prop('id'),
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

        $(elem).append('<option value = "">' +
            '--'+ _.capitalize($(elem).prop('id')) + '--' +'</option>');

        if (id === 'object') {
            Object.values(self.compositionObjs).forEach( function (obj) {
                var selectedStr = (obj.identifier.key === selectedId) ? 'selected' : '';
                $(elem).append(
                    '<option value = ' + obj.identifier.key + ' ' + selectedStr + '>'
                    + obj.name + '</option>'
                );
            });
        } else if (id === 'key') {
            var metaData,
                selectedStr;
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
            if (objId && objId != '' && keyId && keyId !== '')
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

    WidgetView.prototype.loadTelemetryObjects = function () {

    }

    return WidgetView;
});
