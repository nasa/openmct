define(['../src/TestDataItem'], function (TestDataItem) {
  describe('A summary widget test data item', function () {
    let testDataItem;
    let mockConfig;
    let mockConditionManager;
    let mockContainer;
    let mockEvaluator;
    let changeSpy;
    let duplicateSpy;
    let removeSpy;
    let generateValueSpy;

    beforeEach(function () {
      mockContainer = document.createElement('div');

      mockConfig = {
        object: 'object1',
        key: 'property1',
        value: 1
      };

      mockEvaluator = {};
      mockEvaluator.getInputTypeById = jasmine.createSpy('inputType');

      mockConditionManager = jasmine.createSpyObj('mockConditionManager', [
        'on',
        'getComposition',
        'loadCompleted',
        'getEvaluator',
        'getTelemetryMetadata',
        'metadataLoadCompleted',
        'getObjectName',
        'getTelemetryPropertyName',
        'getTelemetryPropertyType'
      ]);
      mockConditionManager.loadCompleted.and.returnValue(false);
      mockConditionManager.metadataLoadCompleted.and.returnValue(false);
      mockConditionManager.getEvaluator.and.returnValue(mockEvaluator);
      mockConditionManager.getComposition.and.returnValue({});
      mockConditionManager.getTelemetryMetadata.and.returnValue({});
      mockConditionManager.getObjectName.and.returnValue('Object Name');
      mockConditionManager.getTelemetryPropertyName.and.returnValue('Property Name');
      mockConditionManager.getTelemetryPropertyType.and.returnValue('');

      duplicateSpy = jasmine.createSpy('duplicate');
      removeSpy = jasmine.createSpy('remove');
      changeSpy = jasmine.createSpy('change');
      generateValueSpy = jasmine.createSpy('generateValueInput');

      testDataItem = new TestDataItem(mockConfig, 54, mockConditionManager);

      testDataItem.on('duplicate', duplicateSpy);
      testDataItem.on('remove', removeSpy);
      testDataItem.on('change', changeSpy);
    });

    it('exposes a DOM element to represent itself in the view', function () {
      mockContainer.append(testDataItem.getDOM());
      expect(mockContainer.querySelectorAll('.t-test-data-item').length).toEqual(1);
    });

    it('responds to a change in its object select', function () {
      testDataItem.selects.object.setSelected('');
      expect(changeSpy).toHaveBeenCalledWith({
        value: '',
        property: 'object',
        index: 54
      });
    });

    it('responds to a change in its key select', function () {
      testDataItem.generateValueInput = generateValueSpy;
      testDataItem.selects.key.setSelected('');
      expect(changeSpy).toHaveBeenCalledWith({
        value: '',
        property: 'key',
        index: 54
      });
      expect(generateValueSpy).toHaveBeenCalledWith('');
    });

    it('generates a value input of the appropriate type', function () {
      let inputs;

      mockContainer.append(testDataItem.getDOM());
      mockEvaluator.getInputTypeById.and.returnValue('number');
      testDataItem.generateValueInput('');

      inputs = mockContainer.querySelectorAll('input');
      const numberInputs = Array.from(inputs).filter((input) => input.type === 'number');

      expect(numberInputs.length).toEqual(1);
      expect(inputs[0].valueAsNumber).toEqual(1);

      mockEvaluator.getInputTypeById.and.returnValue('text');
      testDataItem.config.value = 'Text I Am';
      testDataItem.generateValueInput('');

      inputs = mockContainer.querySelectorAll('input');
      const textInputs = Array.from(inputs).filter((input) => input.type === 'text');

      expect(textInputs.length).toEqual(1);
      expect(inputs[0].value).toEqual('Text I Am');
    });

    it('ensures reasonable defaults on values if none are provided', function () {
      let inputs;

      mockContainer.append(testDataItem.getDOM());

      mockEvaluator.getInputTypeById.and.returnValue('number');
      testDataItem.config.value = undefined;
      testDataItem.generateValueInput('');

      inputs = mockContainer.querySelectorAll('input');
      const numberInputs = Array.from(inputs).filter((input) => input.type === 'number');

      expect(numberInputs.length).toEqual(1);
      expect(inputs[0].valueAsNumber).toEqual(0);
      expect(testDataItem.config.value).toEqual(0);

      mockEvaluator.getInputTypeById.and.returnValue('text');
      testDataItem.config.value = undefined;
      testDataItem.generateValueInput('');

      inputs = mockContainer.querySelectorAll('input');
      const textInputs = Array.from(inputs).filter((input) => input.type === 'text');

      expect(textInputs.length).toEqual(1);
      expect(inputs[0].value).toEqual('');
      expect(testDataItem.config.value).toEqual('');
    });

    it('responds to a change in its value inputs', function () {
      mockContainer.append(testDataItem.getDOM());
      mockEvaluator.getInputTypeById.and.returnValue('number');
      testDataItem.generateValueInput('');

      const event = new Event('input', {
        bubbles: true,
        cancelable: true
      });

      mockContainer.querySelector('input').value = 9001;
      mockContainer.querySelector('input').dispatchEvent(event);

      expect(changeSpy).toHaveBeenCalledWith({
        value: 9001,
        property: 'value',
        index: 54
      });
    });

    it('can remove itself from the configuration', function () {
      testDataItem.remove();
      expect(removeSpy).toHaveBeenCalledWith(54);
    });

    it('can duplicate itself', function () {
      testDataItem.duplicate();
      expect(duplicateSpy).toHaveBeenCalledWith({
        sourceItem: mockConfig,
        index: 54
      });
    });
  });
});
