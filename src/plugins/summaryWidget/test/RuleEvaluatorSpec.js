define(['../src/RuleEvaluator'], function (RuleEvaluator) {
    describe('A Summary Widget Rule Evaluator', function () {
        var evaluator,
            testEvaluator,
            testOperation,
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
            testEvaluator = new RuleEvaluator(mockCache);
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

        it('supports all required operations', function () {
            //equal to
            testOperation = testEvaluator.operations.equalTo.operation;
            expect(testOperation([33,33])).toEqual(true);
            expect(testOperation([55,147])).toEqual(false);
            //not equal to
            testOperation = testEvaluator.operations.notEqualTo.operation;
            expect(testOperation([33,33])).toEqual(false);
            expect(testOperation([55,147])).toEqual(true);
            //greater than
            testOperation = testEvaluator.operations.greaterThan.operation;
            expect(testOperation([100,33])).toEqual(true);
            expect(testOperation([33,33])).toEqual(false);
            expect(testOperation([55,147])).toEqual(false);
            //less than
            testOperation = testEvaluator.operations.lessThan.operation;
            expect(testOperation([100,33])).toEqual(false);
            expect(testOperation([33,33])).toEqual(false);
            expect(testOperation([55,147])).toEqual(true);
            //greater than or equal to
            testOperation = testEvaluator.operations.greaterThanOrEq.operation;
            expect(testOperation([100,33])).toEqual(true);
            expect(testOperation([33,33])).toEqual(true);
            expect(testOperation([55,147])).toEqual(false);
            //less than or equal to
            testOperation = testEvaluator.operations.lessThanOrEq.operation;
            expect(testOperation([100,33])).toEqual(false);
            expect(testOperation([33,33])).toEqual(true);
            expect(testOperation([55,147])).toEqual(true);
            //between
            testOperation = testEvaluator.operations.between.operation;
            expect(testOperation([100,33,66])).toEqual(false);
            expect(testOperation([1,33,66])).toEqual(false);
            expect(testOperation([45,33,66])).toEqual(true);
            //not between
            testOperation = testEvaluator.operations.notBetween.operation;
            expect(testOperation([100,33,66])).toEqual(true);
            expect(testOperation([1,33,66])).toEqual(true);
            expect(testOperation([45,33,66])).toEqual(false);
            //text contains
            testOperation = testEvaluator.operations.textContains.operation;
            expect(testOperation(['Testing', 'tin'])).toEqual(true);
            expect(testOperation(['Testing', 'bind'])).toEqual(false);
            //text does not contain
            testOperation = testEvaluator.operations.textDoesNotContain.operation;
            expect(testOperation(['Testing', 'tin'])).toEqual(false);
            expect(testOperation(['Testing', 'bind'])).toEqual(true);
            //text starts with
            testOperation = testEvaluator.operations.textStartsWith.operation;
            expect(testOperation(['Testing', 'Tes'])).toEqual(true);
            expect(testOperation(['Testing', 'ting'])).toEqual(false);
            //text ends with
            testOperation = testEvaluator.operations.textEndsWith.operation;
            expect(testOperation(['Testing', 'Tes'])).toEqual(false);
            expect(testOperation(['Testing', 'ting'])).toEqual(true);
            //text is exactly
            testOperation = testEvaluator.operations.textIsExactly.operation;
            expect(testOperation(['Testing', 'Testing'])).toEqual(true);
            expect(testOperation(['Testing', 'Test'])).toEqual(false);
            //undefined
            testOperation = testEvaluator.operations.isUndefined.operation;
            expect(testOperation([1])).toEqual(false);
            expect(testOperation([])).toEqual(true);
        });
    });
});
