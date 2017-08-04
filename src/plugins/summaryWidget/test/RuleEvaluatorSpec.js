define(['../src/RuleEvaluator'], function (RuleEvaluator) {
    describe('A Summary Widget Rule Evaluator', function () {
        var evaluator,
            mockCache,
            mockConditions,
            mockConditionsEmpty,
            mockConditionsUndefined,
            mockOperations;

        beforeEach(function () {
            mockCache = {
                a: {
                    alpha: 3,
                    beta: 9,
                    gamma: 'Testing 1 2 3'
                },
                b: {
                    alpha: 44,
                    beta: 23,
                    gamma: 'Hello World'
                },
                c: {
                    foo: 'bar',
                    iAm: 'The Walrus',
                    creature: {
                        type: 'Centaur'
                    }
                }
            }
            mockConditions = [{
                object: 'a',
                key: 'alpha',
                operation: 'greaterThan',
                values: [2]
            },{
                object: 'b',
                key: 'gamma',
                operation: 'lessThan',
                values: [5]
            }]
            mockConditionsEmpty = [{
                object: '',
                key: '',
                operation: '',
                values: []
            }]
            mockConditionsUndefined = [{
                object: 'No Such Object',
                key: '',
                operation: '',
                values: []
            },{
                object: 'a',
                key: 'No Such Key',
                operation: '',
                values: []
            },{
                object: 'a',
                key: 'alpha',
                operation: 'No Such Operation',
                values: []
            }]
            mockOperations = {
                greaterThan: {
                    operation: function (input) {return input[0] > input[1]},
                    text: 'is Greater Than',
                    appliesTo: ['number'],
                    inputCount: 1
                },
                lessThan: {
                    operation: function(input) {return input[0] < input[1]},
                    text: 'is Less Than',
                    appliesTo: ['number'],
                    inputCount: 1
                },
                textContains: {
                    operation: function(input) {return input[0] && input[1] && input[0].includes(input[1])},
                    text: 'Text Contains',
                    appliesTo: ['string'],
                    inputCount: 1
                },
                textIsExactly: {
                    operation: function(input) {return input[0] === input[1]},
                    text: 'Text is Exactly',
                    appliesTo: ['string'],
                    inputCount: 1
                },
                isHalfHorse: {
                    operation: function(input) {return input[0].type === 'Centaur'},
                    text: 'is Half Horse',
                    appliesTo: ['mythicalCreature'],
                    inputCount: 0
                }
            }
            evaluator = new RuleEvaluator(mockCache);
            evaluator.operations = mockOperations;
        });

        it('evaluates to false when a condition has no configuration', function () {
            expect(evaluator.execute(mockConditionsEmpty, 'any')).toEqual(false);
            expect(evaluator.execute(mockConditionsEmpty, 'all')).toEqual(false);
        });

        it('correctly evaluates a set of conditions', function () {
            expect(evaluator.execute(mockConditions, 'any')).toEqual(true);
            expect(evaluator.execute(mockConditions, 'all')).toEqual(false);
        });

        it('handles malformed conditions gracefully', function () {
            //if no conditions are fully defined, should return false
            expect(evaluator.execute(mockConditionsUndefined, 'any')).toEqual(false);
            //these conditions are true: evaluator should ignore undefined conditions,
            //and evaluate the rule as true
            mockConditionsUndefined.push({
                object: 'c',
                key: 'creature',
                operation: 'isHalfHorse',
                values: []
            });
            expect(evaluator.execute(mockConditionsUndefined, 'any')).toEqual(true);
            mockConditionsUndefined.push({
                object: 'c',
                key: 'iAm',
                operation: 'textContains',
                values: ['Walrus']
            });
            expect(evaluator.execute(mockConditionsUndefined, 'all')).toEqual(true);
        });

        it('gets the keys for possible operations', function () {
            expect(evaluator.getOperationKeys()).toEqual(
              ['greaterThan', 'lessThan', 'textContains', 'textIsExactly', 'isHalfHorse'])
        });

        it('gets output text for a given operation', function () {
            expect(evaluator.getOperationText('isHalfHorse')).toEqual('is Half Horse');
        });

        it('correctly returns whether an operation applies to a given type', function() {
            expect(evaluator.operationAppliesTo('isHalfHorse', 'mythicalCreature')).toEqual(true);
            expect(evaluator.operationAppliesTo('isHalfHorse', 'spaceJunk')).toEqual(false);
        });

        it('gets the number of inputs required for a given operation', function () {
            expect(evaluator.getInputCount('isHalfHorse')).toEqual(0);
            expect(evaluator.getInputCount('greaterThan')).toEqual(1);
        });

        it('get what type a given operation applies to', function () {
            expect(evaluator.getOperationType('isHalfHorse')).toEqual('mythicalCreature');
            expect(evaluator.getOperationType('greaterThan')).toEqual('number');
        });

    });
});
