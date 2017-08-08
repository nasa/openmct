define(['../src/Rule'], function (Rule) {
    describe('A Summary Widget Rule', function () {
        var mockRuleConfig,
            mockDomainObject,
            mockOpenMCT,
            mockConditionManager,
            testRule,
            removeSpy,
            duplicateSpy,
            changeSpy;

        beforeEach(function () {
            mockRuleConfig = {
                name: 'Name',
                id: 'mockRule',
                icon: 'test-icon-name',
                style: {
                    'background-color': '',
                    'border-color': '',
                    'color': ''
                },
                expanded: true,
                conditions: []
                // conditions: [{
                //     object: '',
                //     key: '',
                //     operation: '',
                //     values: []
                // }]
            };
            mockDomainObject = {
                ruleConfigById: {
                    mockRule: mockRuleConfig
                }
            };
            mockOpenMCT = jasmine.createSpyObj('', ['objects']);
            mockOpenMCT.objects = jasmine.createSpyObj('', ['mutate']);
            mockConditionManager = jasmine.createSpyObj('', [
                'on',
                'getComposition',
                'loadCompleted'
            ]);
            mockConditionManager.loadCompleted.andReturn(false);
            removeSpy = jasmine.createSpy('removeCallback');
            duplicateSpy = jasmine.createSpy('duplicateCallback');
            changeSpy = jasmine.createSpy('changeCallback');
            testRule = new Rule(mockRuleConfig, mockDomainObject, mockOpenMCT, mockConditionManager);
            testRule.on('remove', removeSpy);
            testRule.on('duplicate', duplicateSpy);
            testRule.on('change', changeSpy);
        });

        it('closes its configuration panel on initial load', function () {
            expect(testRule.getProperty('expanded')).toEqual(false);
        });

        it('returns its configuration properties', function () {
            expect(testRule.getProperty('name')).toEqual('Name');
        });

        // it('handles icon input', function () {
        //     testRule.onIconInput('some-different-icon');
        //     expect(testRule.getProperty('icon')).toEqual('some-different-icon');
        //     expect(changeSpy).toHaveBeenCalled();
        // });
        //
        // it('handles color input', function () {
        //     testRule.onColorInput('some-color', 'background-color');
        //     testRule.onColorInput('some-other-color', 'border-color');
        //     testRule.onColorInput('my-favorite-color', 'color');
        //     expect(testRule.getProperty('style')).toEqual({
        //         'background-color': 'some-color',
        //         'border-color': 'some-other-color',
        //         'color': 'my-favorite-color'
        //     });
        //     expect(changeSpy).toHaveBeenCalled();
        // });

        it('can duplicate itself', function () {
            testRule.duplicate();
            mockRuleConfig.expanded = true;
            expect(duplicateSpy).toHaveBeenCalledWith(mockRuleConfig);
        });
    });
});
