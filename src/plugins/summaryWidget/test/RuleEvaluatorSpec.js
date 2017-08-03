define(['../src/RuleEvaluator'], function (RuleEvaluator) {
    describe('The Summary Widget Rule Evaluator', function () {
        var mockCache, mockConditions1, mockConditions2, mockConditionsEmpty;
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
                    hello: 'goodbye',
                    iAm: 'The Walrus'
                }
            }
            mockConditions1 = [{
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
            mockConditions2 = [{

            }],
            mockConditionsEmpty =[{
                object: '',
                key: '',
                operation: '',
                values: []
            }]
            evaluator = new RuleEvaluator(mockCache);
        });

        it('evaluates to false when a condition has no configuration', function () {
            expect(evaluator.execute(mockConditionsEmpty, 'any')).toEqual(false);
        });

        it('handles undefined fields gracefully')

        it('correctly evaluates a set of conditions', function () {
            expect(evaluator.execute(mockConditions1, 'any')).toEqual(true);
            expect(evaluator.execute(mockConditions1, 'all')).toEqual(false);
        });
    });
});
