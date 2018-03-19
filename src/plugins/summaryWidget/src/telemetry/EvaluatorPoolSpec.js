define([
    './EvaluatorPool',
    './SummaryWidgetEvaluator'
], function (
    EvaluatorPool,
    SummaryWidgetEvaluator
) {
    describe('EvaluatorPool', function () {
        var pool;
        var openmct;
        var objectA;
        var objectB;

        beforeEach(function () {
            openmct = {
                composition: jasmine.createSpyObj('compositionAPI', ['get']),
                objects: jasmine.createSpyObj('objectAPI', ['observe'])
            };
            openmct.composition.get.andCallFake(function () {
                var compositionCollection = jasmine.createSpyObj(
                    'compositionCollection',
                    [
                        'load',
                        'on',
                        'off'
                    ]
                );
                compositionCollection.load.andReturn(Promise.resolve());
                return compositionCollection;
            });
            openmct.objects.observe.andCallFake(function () {
                return function () {};
            });
            pool = new EvaluatorPool(openmct);
            objectA = {
                identifier: {
                    namespace: 'someNamespace',
                    key: 'someKey'
                },
                configuration: {
                    ruleOrder: []
                }
            };
            objectB = {
                identifier: {
                    namespace: 'otherNamespace',
                    key: 'otherKey'
                },
                configuration: {
                    ruleOrder: []
                }
            };
        });

        it('returns new evaluators for different objects', function () {
            var evaluatorA = pool.get(objectA);
            var evaluatorB = pool.get(objectB);
            expect(evaluatorA).not.toBe(evaluatorB);
        });

        it('returns the same evaluator for the same object', function () {
            var evaluatorA = pool.get(objectA);
            var evaluatorB = pool.get(objectA);
            expect(evaluatorA).toBe(evaluatorB);

            var evaluatorC = pool.get(JSON.parse(JSON.stringify(objectA)));
            expect(evaluatorA).toBe(evaluatorC);
        });

        it('returns new evaluator when old is released', function () {
            var evaluatorA = pool.get(objectA);
            var evaluatorB = pool.get(objectA);
            expect(evaluatorA).toBe(evaluatorB);
            pool.release(evaluatorA);
            pool.release(evaluatorB);
            var evaluatorC = pool.get(objectA);
            expect(evaluatorA).not.toBe(evaluatorC);
        });
    });
});
