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
                appliesTo: 'number'
            },
            notEqualTo: {
                operation: function(input) {return input[0] !== input[1]},
                text: 'is Not Equal To',
                appliesTo: 'number'
            },
            greaterThan: {
                operation: function (input) {return input[0] > input[1]},
                text: 'is Greater Than',
                appliesTo: 'number'
            },
            lessThan: {
                operation: function(input) {return input[0] < input[1]},
                text: 'is Less Than',
                appliesTo: 'number'
            },
            greaterThanOrEq: {
                operation: function (input) {return input[0] >= input[1]},
                text: 'is Greater Than or Equal To',
                appliesTo: 'number'
            },
            lessThanOrEq: {
                operation: function (input) {return input[0] >= input[1]},
                text: 'is Less Than or Equal To',
                appliesTo: 'number'
            },
            textContains: {
                operation: function(input) {return input[0].includes(input[1])},
                text: 'Text Contains',
                appliesTo: 'string'
            },
            textDoesNotContain: {
                operation: function(input) {return !input[0]},
                text: 'Text Does Not Contain',
                appliesTo: 'string'
            }
        }
    }

    // evaluate the ruleset passed in as a parameter and return the id of the rule
    // to be displayed in the view
    RuleEvaluator.prototype.execute = function(ruleset) {
        var activeId = 'default';
        (ruleset || []).forEach( function (rule) {

        });
        return activeId;
    }

    RuleEvaluator.prototype.getOperationKeys = function () {
        return Object.keys(this.operations);
    }

    RuleEvaluator.prototype.getOperationText = function (key) {
        return this.operations[key].text
    }

    RuleEvaluator.prototype.operationAppliesTo = function (key, type) {
        return (this.operations[key].appliesTo === type);
    }

    return RuleEvaluator;
});
