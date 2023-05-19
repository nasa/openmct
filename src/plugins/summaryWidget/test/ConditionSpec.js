/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(['../src/Condition'], function (Condition) {
  xdescribe('A summary widget condition', function () {
    let testCondition;
    let mockConfig;
    let mockConditionManager;
    let mockContainer;
    let mockEvaluator;
    let changeSpy;
    let duplicateSpy;
    let removeSpy;
    let generateValuesSpy;

    beforeEach(function () {
      mockContainer = document.createElement('div');

      mockConfig = {
        object: 'object1',
        key: 'property1',
        operation: 'operation1',
        values: [1, 2, 3]
      };

      mockEvaluator = {};
      mockEvaluator.getInputCount = jasmine.createSpy('inputCount');
      mockEvaluator.getInputType = jasmine.createSpy('inputType');

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

      duplicateSpy = jasmine.createSpy('duplicate');
      removeSpy = jasmine.createSpy('remove');
      changeSpy = jasmine.createSpy('change');
      generateValuesSpy = jasmine.createSpy('generateValueInputs');

      testCondition = new Condition(mockConfig, 54, mockConditionManager);

      testCondition.on('duplicate', duplicateSpy);
      testCondition.on('remove', removeSpy);
      testCondition.on('change', changeSpy);
    });

    it('exposes a DOM element to represent itself in the view', function () {
      mockContainer.append(testCondition.getDOM());
      expect(mockContainer.querySelectorAll('.t-condition').length).toEqual(1);
    });

    it('responds to a change in its object select', function () {
      testCondition.selects.object.setSelected('');
      expect(changeSpy).toHaveBeenCalledWith({
        value: '',
        property: 'object',
        index: 54
      });
    });

    it('responds to a change in its key select', function () {
      testCondition.selects.key.setSelected('');
      expect(changeSpy).toHaveBeenCalledWith({
        value: '',
        property: 'key',
        index: 54
      });
    });

    it('responds to a change in its operation select', function () {
      testCondition.generateValueInputs = generateValuesSpy;
      testCondition.selects.operation.setSelected('');
      expect(changeSpy).toHaveBeenCalledWith({
        value: '',
        property: 'operation',
        index: 54
      });
      expect(generateValuesSpy).toHaveBeenCalledWith('');
    });

    it('generates value inputs of the appropriate type and quantity', function () {
      let inputs;

      mockContainer.append(testCondition.getDOM());
      mockEvaluator.getInputType.and.returnValue('number');
      mockEvaluator.getInputCount.and.returnValue(3);
      testCondition.generateValueInputs('');

      inputs = mockContainer.querySelectorAll('input');
      const numberInputs = Array.from(inputs).filter((input) => input.type === 'number');

      expect(numberInputs.length).toEqual(3);
      expect(numberInputs[0].valueAsNumber).toEqual(1);
      expect(numberInputs[1].valueAsNumber).toEqual(2);
      expect(numberInputs[2].valueAsNumber).toEqual(3);

      mockEvaluator.getInputType.and.returnValue('text');
      mockEvaluator.getInputCount.and.returnValue(2);
      testCondition.config.values = ['Text I Am', 'Text It Is'];
      testCondition.generateValueInputs('');

      inputs = mockContainer.querySelectorAll('input');
      const textInputs = Array.from(inputs).filter((input) => input.type === 'text');

      expect(textInputs.length).toEqual(2);
      expect(textInputs[0].value).toEqual('Text I Am');
      expect(textInputs[1].value).toEqual('Text It Is');
    });

    it('ensures reasonable defaults on values if none are provided', function () {
      let inputs;

      mockContainer.append(testCondition.getDOM());
      mockEvaluator.getInputType.and.returnValue('number');
      mockEvaluator.getInputCount.and.returnValue(3);
      testCondition.config.values = [];
      testCondition.generateValueInputs('');

      inputs = Array.from(mockContainer.querySelectorAll('input'));

      expect(inputs[0].valueAsNumber).toEqual(0);
      expect(inputs[1].valueAsNumber).toEqual(0);
      expect(inputs[2].valueAsNumber).toEqual(0);
      expect(testCondition.config.values).toEqual([0, 0, 0]);

      mockEvaluator.getInputType.and.returnValue('text');
      mockEvaluator.getInputCount.and.returnValue(2);
      testCondition.config.values = [];
      testCondition.generateValueInputs('');

      inputs = Array.from(mockContainer.querySelectorAll('input'));

      expect(inputs[0].value).toEqual('');
      expect(inputs[1].value).toEqual('');
      expect(testCondition.config.values).toEqual(['', '']);
    });

    it('responds to a change in its value inputs', function () {
      mockContainer.append(testCondition.getDOM());
      mockEvaluator.getInputType.and.returnValue('number');
      mockEvaluator.getInputCount.and.returnValue(3);
      testCondition.generateValueInputs('');

      const event = new Event('input', {
        bubbles: true,
        cancelable: true
      });
      const inputs = mockContainer.querySelectorAll('input');

      inputs[1].value = 9001;
      inputs[1].dispatchEvent(event);

      expect(changeSpy).toHaveBeenCalledWith({
        value: 9001,
        property: 'values[1]',
        index: 54
      });
    });

    it('can remove itself from the configuration', function () {
      testCondition.remove();
      expect(removeSpy).toHaveBeenCalledWith(54);
    });

    it('can duplicate itself', function () {
      testCondition.duplicate();
      expect(duplicateSpy).toHaveBeenCalledWith({
        sourceCondition: mockConfig,
        index: 54
      });
    });
  });
});
