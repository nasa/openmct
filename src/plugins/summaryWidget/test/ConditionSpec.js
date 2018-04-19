define(['../src/Condition', 'zepto'], function (Condition, $) {
    describe('A summary widget condition', function () {
        var testCondition,
            mockConfig,
            mockConditionManager,
            mockContainer,
            mockEvaluator,
            changeSpy,
            duplicateSpy,
            removeSpy,
            generateValuesSpy;

        beforeEach(function () {
            mockContainer = $(document.createElement('div'));

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
            mockConditionManager.loadCompleted.andReturn(false);
            mockConditionManager.metadataLoadCompleted.andReturn(false);
            mockConditionManager.getEvaluator.andReturn(mockEvaluator);
            mockConditionManager.getComposition.andReturn({});
            mockConditionManager.getTelemetryMetadata.andReturn({});
            mockConditionManager.getObjectName.andReturn('Object Name');
            mockConditionManager.getTelemetryPropertyName.andReturn('Property Name');

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
            expect($('.t-condition', mockContainer).get().length).toEqual(1);
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
            mockContainer.append(testCondition.getDOM());
            mockEvaluator.getInputType.andReturn('number');
            mockEvaluator.getInputCount.andReturn(3);
            testCondition.generateValueInputs('');
            expect($('input', mockContainer).filter('[type=number]').get().length).toEqual(3);
            expect($('input', mockContainer).eq(0).prop('valueAsNumber')).toEqual(1);
            expect($('input', mockContainer).eq(1).prop('valueAsNumber')).toEqual(2);
            expect($('input', mockContainer).eq(2).prop('valueAsNumber')).toEqual(3);

            mockEvaluator.getInputType.andReturn('text');
            mockEvaluator.getInputCount.andReturn(2);
            testCondition.config.values = ['Text I Am', 'Text It Is'];
            testCondition.generateValueInputs('');
            expect($('input', mockContainer).filter('[type=text]').get().length).toEqual(2);
            expect($('input', mockContainer).eq(0).prop('value')).toEqual('Text I Am');
            expect($('input', mockContainer).eq(1).prop('value')).toEqual('Text It Is');
        });

        it('ensures reasonable defaults on values if none are provided', function () {
            mockContainer.append(testCondition.getDOM());
            mockEvaluator.getInputType.andReturn('number');
            mockEvaluator.getInputCount.andReturn(3);
            testCondition.config.values = [];
            testCondition.generateValueInputs('');
            expect($('input', mockContainer).eq(0).prop('valueAsNumber')).toEqual(0);
            expect($('input', mockContainer).eq(1).prop('valueAsNumber')).toEqual(0);
            expect($('input', mockContainer).eq(2).prop('valueAsNumber')).toEqual(0);
            expect(testCondition.config.values).toEqual([0, 0, 0]);

            mockEvaluator.getInputType.andReturn('text');
            mockEvaluator.getInputCount.andReturn(2);
            testCondition.config.values = [];
            testCondition.generateValueInputs('');
            expect($('input', mockContainer).eq(0).prop('value')).toEqual('');
            expect($('input', mockContainer).eq(1).prop('value')).toEqual('');
            expect(testCondition.config.values).toEqual(['', '']);
        });

        it('responds to a change in its value inputs', function () {
            mockContainer.append(testCondition.getDOM());
            mockEvaluator.getInputType.andReturn('number');
            mockEvaluator.getInputCount.andReturn(3);
            testCondition.generateValueInputs('');
            $('input', mockContainer).eq(1).prop('value', 9001);
            $('input', mockContainer).eq(1).trigger('input');
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
