define(['../src/Rule'], function (Rule) {
  describe('A Summary Widget Rule', function () {
    let mockRuleConfig;
    let mockDomainObject;
    let mockOpenMCT;
    let mockConditionManager;
    let mockWidgetDnD;
    let mockEvaluator;
    let mockContainer;
    let testRule;
    let removeSpy;
    let duplicateSpy;
    let changeSpy;
    let conditionChangeSpy;

    beforeEach(function () {
      mockRuleConfig = {
        name: 'Name',
        id: 'mockRule',
        icon: 'test-icon-name',
        style: {
          'background-color': '',
          'border-color': '',
          color: ''
        },
        expanded: true,
        conditions: [
          {
            object: '',
            key: '',
            operation: '',
            values: []
          },
          {
            object: 'blah',
            key: 'blah',
            operation: 'blah',
            values: ['blah.', 'blah!', 'blah?']
          }
        ]
      };
      mockDomainObject = {
        configuration: {
          ruleConfigById: {
            mockRule: mockRuleConfig,
            otherRule: {}
          },
          ruleOrder: ['default', 'mockRule', 'otherRule']
        }
      };

      mockOpenMCT = {};
      mockOpenMCT.objects = {};
      mockOpenMCT.objects.mutate = jasmine.createSpy('mutate');

      mockEvaluator = {};
      mockEvaluator.getOperationDescription = jasmine
        .createSpy('evaluator')
        .and.returnValue('Operation Description');

      mockConditionManager = jasmine.createSpyObj('mockConditionManager', [
        'on',
        'getComposition',
        'loadCompleted',
        'getEvaluator',
        'getTelemetryMetadata',
        'metadataLoadCompleted',
        'getObjectName',
        'getTelemetryPropertyName'
      ]);
      mockConditionManager.loadCompleted.and.returnValue(false);
      mockConditionManager.metadataLoadCompleted.and.returnValue(false);
      mockConditionManager.getEvaluator.and.returnValue(mockEvaluator);
      mockConditionManager.getComposition.and.returnValue({});
      mockConditionManager.getTelemetryMetadata.and.returnValue({});
      mockConditionManager.getObjectName.and.returnValue('Object Name');
      mockConditionManager.getTelemetryPropertyName.and.returnValue('Property Name');

      mockWidgetDnD = jasmine.createSpyObj('dnd', ['on', 'setDragImage', 'dragStart']);

      mockContainer = document.createElement('div');

      removeSpy = jasmine.createSpy('removeCallback');
      duplicateSpy = jasmine.createSpy('duplicateCallback');
      changeSpy = jasmine.createSpy('changeCallback');
      conditionChangeSpy = jasmine.createSpy('conditionChangeCallback');

      testRule = new Rule(
        mockRuleConfig,
        mockDomainObject,
        mockOpenMCT,
        mockConditionManager,
        mockWidgetDnD
      );
      testRule.on('remove', removeSpy);
      testRule.on('duplicate', duplicateSpy);
      testRule.on('change', changeSpy);
      testRule.on('conditionChange', conditionChangeSpy);
    });

    it('closes its configuration panel on initial load', function () {
      expect(testRule.getProperty('expanded')).toEqual(false);
    });

    it('gets its DOM element', function () {
      mockContainer.append(testRule.getDOM());
      expect(mockContainer.querySelectorAll('.l-widget-rule').length).toBeGreaterThan(0);
    });

    it('gets its configuration properties', function () {
      expect(testRule.getProperty('name')).toEqual('Name');
      expect(testRule.getProperty('icon')).toEqual('test-icon-name');
    });

    it('can duplicate itself', function () {
      testRule.duplicate();
      mockRuleConfig.expanded = true;
      expect(duplicateSpy).toHaveBeenCalledWith(mockRuleConfig);
    });

    it('can remove itself from the configuration', function () {
      testRule.remove();
      expect(removeSpy).toHaveBeenCalled();
      expect(mockDomainObject.configuration.ruleConfigById.mockRule).not.toBeDefined();
      expect(mockDomainObject.configuration.ruleOrder).toEqual(['default', 'otherRule']);
    });

    it('updates its configuration on a condition change and invokes callbacks', function () {
      testRule.onConditionChange({
        value: 'newValue',
        property: 'object',
        index: 0
      });
      expect(testRule.getProperty('conditions')[0].object).toEqual('newValue');
      expect(conditionChangeSpy).toHaveBeenCalled();
    });

    it('allows initializing a new condition with a default configuration', function () {
      testRule.initCondition();
      expect(mockRuleConfig.conditions).toEqual([
        {
          object: '',
          key: '',
          operation: '',
          values: []
        },
        {
          object: 'blah',
          key: 'blah',
          operation: 'blah',
          values: ['blah.', 'blah!', 'blah?']
        },
        {
          object: '',
          key: '',
          operation: '',
          values: []
        }
      ]);
    });

    it('allows initializing a new condition from a given configuration', function () {
      testRule.initCondition({
        sourceCondition: {
          object: 'object1',
          key: 'key1',
          operation: 'operation1',
          values: [1, 2, 3]
        },
        index: 0
      });
      expect(mockRuleConfig.conditions).toEqual([
        {
          object: '',
          key: '',
          operation: '',
          values: []
        },
        {
          object: 'object1',
          key: 'key1',
          operation: 'operation1',
          values: [1, 2, 3]
        },
        {
          object: 'blah',
          key: 'blah',
          operation: 'blah',
          values: ['blah.', 'blah!', 'blah?']
        }
      ]);
    });

    it('invokes mutate when updating the domain object', function () {
      testRule.updateDomainObject();
      expect(mockOpenMCT.objects.mutate).toHaveBeenCalled();
    });

    it('builds condition view from condition configuration', function () {
      mockContainer.append(testRule.getDOM());
      expect(mockContainer.querySelectorAll('.t-condition').length).toEqual(2);
    });

    it('responds to input of style properties, and updates the preview', function () {
      testRule.colorInputs['background-color'].set('#434343');
      expect(mockRuleConfig.style['background-color']).toEqual('#434343');
      testRule.colorInputs['border-color'].set('#666666');
      expect(mockRuleConfig.style['border-color']).toEqual('#666666');
      testRule.colorInputs.color.set('#999999');
      expect(mockRuleConfig.style.color).toEqual('#999999');

      expect(testRule.thumbnail.style['background-color']).toEqual('rgb(67, 67, 67)');
      expect(testRule.thumbnail.style['border-color']).toEqual('rgb(102, 102, 102)');
      expect(testRule.thumbnail.style.color).toEqual('rgb(153, 153, 153)');

      expect(changeSpy).toHaveBeenCalled();
    });

    it('responds to input for the icon property', function () {
      testRule.iconInput.set('icon-alert-rect');
      expect(mockRuleConfig.icon).toEqual('icon-alert-rect');
      expect(changeSpy).toHaveBeenCalled();
    });

    /*
        test for js condition commented out for v1
        */

    // it('responds to input of text properties', function () {
    //     var testInputs = ['name', 'label', 'message', 'jsCondition'],
    //         input;

    //     testInputs.forEach(function (key) {
    //         input = testRule.textInputs[key];
    //         input.prop('value', 'A new ' + key);
    //         input.trigger('input');
    //         expect(mockRuleConfig[key]).toEqual('A new ' + key);
    //     });

    //     expect(changeSpy).toHaveBeenCalled();
    // });

    it('allows input for when the rule triggers', function () {
      testRule.trigger.value = 'all';
      const event = new Event('change', {
        bubbles: true,
        cancelable: true
      });
      testRule.trigger.dispatchEvent(event);
      expect(testRule.config.trigger).toEqual('all');
      expect(conditionChangeSpy).toHaveBeenCalled();
    });

    it('generates a human-readable description from its conditions', function () {
      testRule.generateDescription();
      expect(testRule.config.description).toContain(
        "Object Name's Property Name Operation Description"
      );
      testRule.config.trigger = 'js';
      testRule.generateDescription();
      expect(testRule.config.description).toContain(
        'when a custom JavaScript condition evaluates to true'
      );
    });

    it('initiates a drag event when its grippy is clicked', function () {
      const event = new Event('mousedown', {
        bubbles: true,
        cancelable: true
      });
      testRule.grippy.dispatchEvent(event);

      expect(mockWidgetDnD.setDragImage).toHaveBeenCalled();
      expect(mockWidgetDnD.dragStart).toHaveBeenCalledWith('mockRule');
    });

    /*
        test for js condition commented out for v1
        */

    it('can remove a condition from its configuration', function () {
      testRule.removeCondition(0);
      expect(testRule.config.conditions).toEqual([
        {
          object: 'blah',
          key: 'blah',
          operation: 'blah',
          values: ['blah.', 'blah!', 'blah?']
        }
      ]);
    });
  });
});
