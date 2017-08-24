define(['../src/Condition', 'zepto'], function (Condition, $) {
    describe('A summary widget condtion', function () {
        var testCondition,
            mockConfig,
            mockConditionManager,
            mockContainer,
            mockEvaluator,
            changeSpy,
            duplicateSpy,
            removeSpy;

        beforeEach(function () {
            mockContainer = $(document.createElement('div'));

            mockConfig = {
                object: 'object1',
                key: 'property1',
                operation: 'operation1',
                values: [1, 2, 3]
            };

            mockEvaluator = {};

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

            testCondition = new Condition(mockConfig, 54, mockConditionManager);

            testCondition.on('duplicate', duplicateSpy);
            testCondition.on('remove', removeSpy);
            testCondition.on('change', changeSpy);
        });

        it('exposes a DOM element to represent itself in the view', function () {
            mockContainer.append(testCondition.getDOM());
            expect($('.t-condition', mockContainer).get().length).toEqual(1);
        });

        it('responds to a change in one of its selects', function () {

        });

        it('generates a value input of the appropriate type', function () {

        });

        it('reponds to a change in its value input', function () {

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
