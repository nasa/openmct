define(['../src/TestDataManager'], function (TestDataManager) {
  describe('A Summary Widget Rule', function () {
    let mockDomainObject;
    let mockOpenMCT;
    let mockConditionManager;
    let mockEvaluator;
    let mockContainer;
    let mockTelemetryMetadata;
    let testDataManager;
    let mockCompObject1;
    let mockCompObject2;

    beforeEach(function () {
      mockDomainObject = {
        configuration: {
          testDataConfig: [
            {
              object: '',
              key: '',
              value: ''
            },
            {
              object: 'object1',
              key: 'property1',
              value: 66
            },
            {
              object: 'object2',
              key: 'property4',
              value: 'Text It Is'
            }
          ]
        },
        composition: [
          {
            object1: {
              key: 'object1',
              name: 'Object 1'
            },
            object2: {
              key: 'object2',
              name: 'Object 2'
            }
          }
        ]
      };

      mockTelemetryMetadata = {
        object1: {
          property1: {
            key: 'property1'
          },
          property2: {
            key: 'property2'
          }
        },
        object2: {
          property3: {
            key: 'property3'
          },
          property4: {
            key: 'property4'
          }
        }
      };

      mockCompObject1 = {
        identifier: {
          key: 'object1'
        },
        name: 'Object 1'
      };
      mockCompObject2 = {
        identifier: {
          key: 'object2'
        },
        name: 'Object 2'
      };

      mockOpenMCT = {};
      mockOpenMCT.objects = {};
      mockOpenMCT.objects.mutate = jasmine.createSpy('mutate');

      mockEvaluator = {};
      mockEvaluator.setTestDataCache = jasmine.createSpy('testDataCache');
      mockEvaluator.useTestData = jasmine.createSpy('useTestData');

      mockConditionManager = jasmine.createSpyObj('mockConditionManager', [
        'on',
        'getComposition',
        'loadCompleted',
        'getEvaluator',
        'getTelemetryMetadata',
        'metadataLoadCompleted',
        'getObjectName',
        'getTelemetryPropertyName',
        'triggerTelemetryCallback'
      ]);
      mockConditionManager.loadCompleted.and.returnValue(false);
      mockConditionManager.metadataLoadCompleted.and.returnValue(false);
      mockConditionManager.getEvaluator.and.returnValue(mockEvaluator);
      mockConditionManager.getComposition.and.returnValue({
        object1: mockCompObject1,
        object2: mockCompObject2
      });
      mockConditionManager.getTelemetryMetadata.and.callFake(function (id) {
        return mockTelemetryMetadata[id];
      });
      mockConditionManager.getObjectName.and.returnValue('Object Name');
      mockConditionManager.getTelemetryPropertyName.and.returnValue('Property Name');

      mockContainer = document.createElement('div');

      testDataManager = new TestDataManager(mockDomainObject, mockConditionManager, mockOpenMCT);
    });

    it('closes its configuration panel on initial load', function () {});

    it('exposes a DOM element to represent itself in the view', function () {
      mockContainer.append(testDataManager.getDOM());
      expect(mockContainer.querySelectorAll('.t-widget-test-data-content').length).toBeGreaterThan(
        0
      );
    });

    it('generates a test cache in the format expected by a condition evaluator', function () {
      testDataManager.updateTestCache();
      expect(mockEvaluator.setTestDataCache).toHaveBeenCalledWith({
        object1: {
          property1: 66,
          property2: ''
        },
        object2: {
          property3: '',
          property4: 'Text It Is'
        }
      });
    });

    it(
      'updates its configuration on a item change and provides an updated' +
        'cache to the evaluator',
      function () {
        testDataManager.onItemChange({
          value: 26,
          property: 'value',
          index: 1
        });
        expect(testDataManager.config[1].value).toEqual(26);
        expect(mockEvaluator.setTestDataCache).toHaveBeenCalledWith({
          object1: {
            property1: 26,
            property2: ''
          },
          object2: {
            property3: '',
            property4: 'Text It Is'
          }
        });
      }
    );

    it('allows initializing a new item with a default configuration', function () {
      testDataManager.initItem();
      expect(mockDomainObject.configuration.testDataConfig).toEqual([
        {
          object: '',
          key: '',
          value: ''
        },
        {
          object: 'object1',
          key: 'property1',
          value: 66
        },
        {
          object: 'object2',
          key: 'property4',
          value: 'Text It Is'
        },
        {
          object: '',
          key: '',
          value: ''
        }
      ]);
    });

    it('allows initializing a new item from a given configuration', function () {
      testDataManager.initItem({
        sourceItem: {
          object: 'object2',
          key: 'property3',
          value: 1
        },
        index: 0
      });
      expect(mockDomainObject.configuration.testDataConfig).toEqual([
        {
          object: '',
          key: '',
          value: ''
        },
        {
          object: 'object2',
          key: 'property3',
          value: 1
        },
        {
          object: 'object1',
          key: 'property1',
          value: 66
        },
        {
          object: 'object2',
          key: 'property4',
          value: 'Text It Is'
        }
      ]);
    });

    it('invokes mutate when updating the domain object', function () {
      testDataManager.updateDomainObject();
      expect(mockOpenMCT.objects.mutate).toHaveBeenCalled();
    });

    it('builds item view from item configuration', function () {
      mockContainer.append(testDataManager.getDOM());
      expect(mockContainer.querySelectorAll('.t-test-data-item').length).toEqual(3);
    });

    it('can remove a item from its configuration', function () {
      testDataManager.removeItem(0);
      expect(mockDomainObject.configuration.testDataConfig).toEqual([
        {
          object: 'object1',
          key: 'property1',
          value: 66
        },
        {
          object: 'object2',
          key: 'property4',
          value: 'Text It Is'
        }
      ]);
    });

    it('exposes a UI element to toggle test data on and off', function () {});
  });
});
