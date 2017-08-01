define(
    [],
    function (
    ) {

    function RuleEvaluator() {

        // operations supported by this rule evaluator. Each rule has a method
        // with input boolean return type to be evaluated when the operation is
        // executed, a human-readable text description to populate lists in
        // the view, and a key for what type it applies to
        this.operations = {
            equalTo: {
                operation: function(input) {return input[0] === input[1]},
                text: 'is Equal To',
                appliesTo: ['number'],
                inputCount: 1
            },
            notEqualTo: {
                operation: function(input) {return input[0] !== input[1]},
                text: 'is Not Equal To',
                appliesTo: ['number'],
                inputCount: 1
            },
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
            greaterThanOrEq: {
                operation: function (input) {return input[0] >= input[1]},
                text: 'is Greater Than or Equal To',
                appliesTo: ['number'],
                inputCount: 1
            },
            lessThanOrEq: {
                operation: function (input) {return input[0] >= input[1]},
                text: 'is Less Than or Equal To',
                appliesTo: ['number'],
                inputCount: 1
            },
            between: {
                operation: function (input) {return input[0] > input[1] && input[0] < input[2]},
                text: 'is Between',
                appliesTo: ['number'],
                inputCount: 2
            },
            textContains: {
                operation: function(input) {return input[0].includes(input[1])},
                text: 'Text Contains',
                appliesTo: ['string'],
                inputCount: 1
            },
            textDoesNotContain: {
                operation: function(input) {return !input[0].includes(input[1])},
                text: 'Text Does Not Contain',
                appliesTo: ['string'],
                inputCount: 1
            },
            textStartsWith: {
                operation: function(input) {return input[0].startsWith(input[1])},
                text: 'Text Starts With',
                appliesTo: ['string'],
                inputCount: 1
            },
            textEndsWith: {
                operation: function(input) {return input[0].endsWith(input[1])},
                text: 'Text Ends With',
                appliesTo: ['string'],
                inputCount: 1
            },
            textIsExactly: {
                operation: function(input) {return input[0] === input[1]},
                text: 'Text is Exactly',
                appliesTo: ['string'],
                inputCount: 1
            },
            isUndefined: {
                operation: function(input) {return typeof input === 'undefined'},
                text: 'is Undefined',
                appliesTo: ['string', 'number'],
                inputCount: 0
            }
        }
    }

    // evaluate the conditions passed in as an argument return whether these
    // conditions evaluate to true
    RuleEvaluator.prototype.execute = function(conditions) {
        var active = false;
        (conditions || []).forEach( function (condition) {

        });
        return active;
    }

    RuleEvaluator.prototype.getOperationKeys = function () {
        return Object.keys(this.operations);
    }

    RuleEvaluator.prototype.getOperationText = function (key) {
        return this.operations[key].text;
    }

    RuleEvaluator.prototype.operationAppliesTo = function (key, type) {
        return (this.operations[key].appliesTo.includes(type));
    }

    RuleEvaluator.prototype.getInputCount = function(key) {
        if (this.operations[key]) {
            return this.operations[key].inputCount;
        }
    }

    RuleEvaluator.prototype.getOperationType = function(key) {
        if (this.operations[key]) {
            return this.operations[key].appliesTo[0];
        }
    }

    return RuleEvaluator;
});
