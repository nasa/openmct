define(['../../src/input/OperationSelect'], function (OperationSelect) {
  describe('A select for choosing composition object properties', function () {
    let mockConfig;
    let mockBadConfig;
    let mockManager;
    let operationSelect;
    let mockOperations;
    let mockPropertyTypes;
    let mockKeySelect;
    let mockEvaluator;
    beforeEach(function () {
      mockConfig = {
        object: 'object1',
        key: 'a',
        operation: 'operation1'
      };

      mockBadConfig = {
        object: 'object1',
        key: 'a',
        operation: 'someNonexistentOperation'
      };

      mockOperations = {
        operation1: {
          text: 'An operation',
          appliesTo: ['number']
        },
        operation2: {
          text: 'Another operation',
          appliesTo: ['string']
        }
      };

      mockPropertyTypes = {
        object1: {
          a: 'number',
          b: 'string',
          c: 'number'
        }
      };

      mockManager = jasmine.createSpyObj('mockManager', [
        'on',
        'metadataLoadCompleted',
        'triggerCallback',
        'getTelemetryPropertyType',
        'getEvaluator'
      ]);

      mockKeySelect = jasmine.createSpyObj('mockKeySelect', ['on', 'triggerCallback']);

      mockEvaluator = jasmine.createSpyObj('mockEvaluator', [
        'getOperationKeys',
        'operationAppliesTo',
        'getOperationText'
      ]);

      mockEvaluator.getOperationKeys.and.returnValue(Object.keys(mockOperations));

      mockEvaluator.getOperationText.and.callFake(function (key) {
        return mockOperations[key].text;
      });

      mockEvaluator.operationAppliesTo.and.callFake(function (operation, type) {
        return mockOperations[operation].appliesTo.includes(type);
      });

      mockKeySelect.on.and.callFake((event, callback) => {
        mockKeySelect.callbacks = mockKeySelect.callbacks || {};
        mockKeySelect.callbacks[event] = callback;
      });

      mockKeySelect.triggerCallback.and.callFake((event, key) => {
        mockKeySelect.callbacks[event](key);
      });

      mockManager.on.and.callFake((event, callback) => {
        mockManager.callbacks = mockManager.callbacks || {};
        mockManager.callbacks[event] = callback;
      });

      mockManager.triggerCallback.and.callFake((event) => {
        mockManager.callbacks[event]();
      });

      mockManager.getTelemetryPropertyType.and.callFake(function (object, key) {
        return mockPropertyTypes[object][key];
      });

      mockManager.getEvaluator.and.returnValue(mockEvaluator);
    });

    it('waits until the metadata fully loads to populate itself', function () {
      mockManager.metadataLoadCompleted.and.returnValue(false);
      operationSelect = new OperationSelect(mockConfig, mockKeySelect, mockManager);
      expect(operationSelect.getSelected()).toEqual('');
    });

    it('populates itself with operations on a metadata load', function () {
      mockManager.metadataLoadCompleted.and.returnValue(false);
      operationSelect = new OperationSelect(mockConfig, mockKeySelect, mockManager);
      mockManager.triggerCallback('metadata');
      expect(operationSelect.getSelected()).toEqual('operation1');
    });

    it('populates itself with operations if metadata load is already complete', function () {
      mockManager.metadataLoadCompleted.and.returnValue(true);
      operationSelect = new OperationSelect(mockConfig, mockKeySelect, mockManager);
      expect(operationSelect.getSelected()).toEqual('operation1');
    });

    it('clears its selection state if the operation in its config does not apply', function () {
      mockManager.metadataLoadCompleted.and.returnValue(true);
      operationSelect = new OperationSelect(mockBadConfig, mockKeySelect, mockManager);
      expect(operationSelect.getSelected()).toEqual('');
    });

    it('populates with the appropriate options when its linked key changes', function () {
      mockManager.metadataLoadCompleted.and.returnValue(true);
      operationSelect = new OperationSelect(mockConfig, mockKeySelect, mockManager);
      mockKeySelect.triggerCallback('change', 'b');
      operationSelect.setSelected('operation2');
      expect(operationSelect.getSelected()).toEqual('operation2');
      operationSelect.setSelected('operation1');
      expect(operationSelect.getSelected()).not.toEqual('operation1');
    });

    it('clears its selection on a change if the operation does not apply', function () {
      mockManager.metadataLoadCompleted.and.returnValue(true);
      operationSelect = new OperationSelect(mockConfig, mockKeySelect, mockManager);
      mockKeySelect.triggerCallback('change', 'b');
      expect(operationSelect.getSelected()).toEqual('');
    });

    it('maintains its selected state on change if the operation does apply', function () {
      mockManager.metadataLoadCompleted.and.returnValue(true);
      operationSelect = new OperationSelect(mockConfig, mockKeySelect, mockManager);
      mockKeySelect.triggerCallback('change', 'c');
      expect(operationSelect.getSelected()).toEqual('operation1');
    });
  });
});
