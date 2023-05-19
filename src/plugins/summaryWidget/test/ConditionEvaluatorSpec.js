define(['../src/ConditionEvaluator'], function (ConditionEvaluator) {
  describe('A Summary Widget Rule Evaluator', function () {
    let evaluator;
    let testEvaluator;
    let testOperation;
    let mockCache;
    let mockTestCache;
    let mockComposition;
    let mockConditions;
    let mockConditionsEmpty;
    let mockConditionsUndefined;
    let mockConditionsAnyTrue;
    let mockConditionsAllTrue;
    let mockConditionsAnyFalse;
    let mockConditionsAllFalse;
    let mockOperations;

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
      };
      mockTestCache = {
        a: {
          alpha: 1,
          beta: 1,
          gamma: 'Testing 4 5 6'
        },
        b: {
          alpha: 2,
          beta: 2,
          gamma: 'Goodbye world'
        }
      };
      mockComposition = {
        a: {},
        b: {},
        c: {}
      };
      mockConditions = [
        {
          object: 'a',
          key: 'alpha',
          operation: 'greaterThan',
          values: [2]
        },
        {
          object: 'b',
          key: 'gamma',
          operation: 'lessThan',
          values: [5]
        }
      ];
      mockConditionsEmpty = [
        {
          object: '',
          key: '',
          operation: '',
          values: []
        }
      ];
      mockConditionsUndefined = [
        {
          object: 'No Such Object',
          key: '',
          operation: '',
          values: []
        },
        {
          object: 'a',
          key: 'No Such Key',
          operation: '',
          values: []
        },
        {
          object: 'a',
          key: 'alpha',
          operation: 'No Such Operation',
          values: []
        },
        {
          object: 'all',
          key: 'Nonexistent Field',
          operation: 'Random Operation',
          values: []
        },
        {
          object: 'any',
          key: 'Nonexistent Field',
          operation: 'Whatever Operation',
          values: []
        }
      ];
      mockConditionsAnyTrue = [
        {
          object: 'any',
          key: 'alpha',
          operation: 'greaterThan',
          values: [5]
        }
      ];
      mockConditionsAnyFalse = [
        {
          object: 'any',
          key: 'alpha',
          operation: 'greaterThan',
          values: [1000]
        }
      ];
      mockConditionsAllFalse = [
        {
          object: 'all',
          key: 'alpha',
          operation: 'greaterThan',
          values: [5]
        }
      ];
      mockConditionsAllTrue = [
        {
          object: 'all',
          key: 'alpha',
          operation: 'greaterThan',
          values: [0]
        }
      ];
      mockOperations = {
        greaterThan: {
          operation: function (input) {
            return input[0] > input[1];
          },
          text: 'is greater than',
          appliesTo: ['number'],
          inputCount: 1,
          getDescription: function (values) {
            return ' > ' + values[0];
          }
        },
        lessThan: {
          operation: function (input) {
            return input[0] < input[1];
          },
          text: 'is less than',
          appliesTo: ['number'],
          inputCount: 1
        },
        textContains: {
          operation: function (input) {
            return input[0] && input[1] && input[0].includes(input[1]);
          },
          text: 'text contains',
          appliesTo: ['string'],
          inputCount: 1
        },
        textIsExactly: {
          operation: function (input) {
            return input[0] === input[1];
          },
          text: 'text is exactly',
          appliesTo: ['string'],
          inputCount: 1
        },
        isHalfHorse: {
          operation: function (input) {
            return input[0].type === 'Centaur';
          },
          text: 'is Half Horse',
          appliesTo: ['mythicalCreature'],
          inputCount: 0,
          getDescription: function () {
            return 'is half horse';
          }
        }
      };
      evaluator = new ConditionEvaluator(mockCache, mockComposition);
      testEvaluator = new ConditionEvaluator(mockCache, mockComposition);
      evaluator.operations = mockOperations;
    });

    it('evaluates a condition when it has no configuration', function () {
      expect(evaluator.execute(mockConditionsEmpty, 'any')).toEqual(false);
      expect(evaluator.execute(mockConditionsEmpty, 'all')).toEqual(false);
    });

    it('correctly evaluates a set of conditions', function () {
      expect(evaluator.execute(mockConditions, 'any')).toEqual(true);
      expect(evaluator.execute(mockConditions, 'all')).toEqual(false);
    });

    it('correctly evaluates conditions involving "any telemetry"', function () {
      expect(evaluator.execute(mockConditionsAnyTrue, 'any')).toEqual(true);
      expect(evaluator.execute(mockConditionsAnyFalse, 'any')).toEqual(false);
    });

    it('correctly evaluates conditions involving "all telemetry"', function () {
      expect(evaluator.execute(mockConditionsAllTrue, 'any')).toEqual(true);
      expect(evaluator.execute(mockConditionsAllFalse, 'any')).toEqual(false);
    });

    it('handles malformed conditions gracefully', function () {
      //if no conditions are fully defined, should return false for any mode
      expect(evaluator.execute(mockConditionsUndefined, 'any')).toEqual(false);
      expect(evaluator.execute(mockConditionsUndefined, 'all')).toEqual(false);
      //these conditions are true: evaluator should ignore undefined conditions,
      //and evaluate the rule as true
      mockConditionsUndefined.push({
        object: 'a',
        key: 'gamma',
        operation: 'textContains',
        values: ['Testing']
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
      expect(evaluator.getOperationKeys()).toEqual([
        'greaterThan',
        'lessThan',
        'textContains',
        'textIsExactly',
        'isHalfHorse'
      ]);
    });

    it('gets output text for a given operation', function () {
      expect(evaluator.getOperationText('isHalfHorse')).toEqual('is Half Horse');
    });

    it('correctly returns whether an operation applies to a given type', function () {
      expect(evaluator.operationAppliesTo('isHalfHorse', 'mythicalCreature')).toEqual(true);
      expect(evaluator.operationAppliesTo('isHalfHorse', 'spaceJunk')).toEqual(false);
    });

    it('returns the HTML input type associated with a given data type', function () {
      expect(evaluator.getInputTypeById('string')).toEqual('text');
    });

    it('gets the number of inputs required for a given operation', function () {
      expect(evaluator.getInputCount('isHalfHorse')).toEqual(0);
      expect(evaluator.getInputCount('greaterThan')).toEqual(1);
    });

    it('gets a human-readable description of a condition', function () {
      expect(evaluator.getOperationDescription('isHalfHorse')).toEqual('is half horse');
      expect(evaluator.getOperationDescription('greaterThan', [1])).toEqual(' > 1');
    });

    it('allows setting a substitute cache for testing purposes, and toggling its use', function () {
      evaluator.setTestDataCache(mockTestCache);
      evaluator.useTestData(true);
      expect(evaluator.execute(mockConditions, 'any')).toEqual(false);
      expect(evaluator.execute(mockConditions, 'all')).toEqual(false);
      mockConditions.push({
        object: 'a',
        key: 'gamma',
        operation: 'textContains',
        values: ['4 5 6']
      });
      expect(evaluator.execute(mockConditions, 'any')).toEqual(true);
      expect(evaluator.execute(mockConditions, 'all')).toEqual(false);
      mockConditions.pop();
      evaluator.useTestData(false);
      expect(evaluator.execute(mockConditions, 'any')).toEqual(true);
      expect(evaluator.execute(mockConditions, 'all')).toEqual(false);
    });

    it('supports all required operations', function () {
      //equal to
      testOperation = testEvaluator.operations.equalTo.operation;
      expect(testOperation([33, 33])).toEqual(true);
      expect(testOperation([55, 147])).toEqual(false);
      //not equal to
      testOperation = testEvaluator.operations.notEqualTo.operation;
      expect(testOperation([33, 33])).toEqual(false);
      expect(testOperation([55, 147])).toEqual(true);
      //greater than
      testOperation = testEvaluator.operations.greaterThan.operation;
      expect(testOperation([100, 33])).toEqual(true);
      expect(testOperation([33, 33])).toEqual(false);
      expect(testOperation([55, 147])).toEqual(false);
      //less than
      testOperation = testEvaluator.operations.lessThan.operation;
      expect(testOperation([100, 33])).toEqual(false);
      expect(testOperation([33, 33])).toEqual(false);
      expect(testOperation([55, 147])).toEqual(true);
      //greater than or equal to
      testOperation = testEvaluator.operations.greaterThanOrEq.operation;
      expect(testOperation([100, 33])).toEqual(true);
      expect(testOperation([33, 33])).toEqual(true);
      expect(testOperation([55, 147])).toEqual(false);
      //less than or equal to
      testOperation = testEvaluator.operations.lessThanOrEq.operation;
      expect(testOperation([100, 33])).toEqual(false);
      expect(testOperation([33, 33])).toEqual(true);
      expect(testOperation([55, 147])).toEqual(true);
      //between
      testOperation = testEvaluator.operations.between.operation;
      expect(testOperation([100, 33, 66])).toEqual(false);
      expect(testOperation([1, 33, 66])).toEqual(false);
      expect(testOperation([45, 33, 66])).toEqual(true);
      //not between
      testOperation = testEvaluator.operations.notBetween.operation;
      expect(testOperation([100, 33, 66])).toEqual(true);
      expect(testOperation([1, 33, 66])).toEqual(true);
      expect(testOperation([45, 33, 66])).toEqual(false);
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
      //isDefined
      testOperation = testEvaluator.operations.isDefined.operation;
      expect(testOperation([1])).toEqual(true);
      expect(testOperation([])).toEqual(false);
    });

    it('can produce a description for all supported operations', function () {
      testEvaluator.getOperationKeys().forEach(function (key) {
        expect(testEvaluator.getOperationDescription(key, [])).toBeDefined();
      });
    });
  });
});
