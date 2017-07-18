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
                appliesTo: ['Number', 'String', 'Boolean']
            },
            notEqualTo: {
                operation: function(input) {return input[0] !== input[1]},
                text: ' is Not Equal To',
                appliesTo: ['Number', 'String', 'Boolean']
            },
            greaterThan: {
                operation: function (input) {return input[0] > input[1]},
                text: ' is Greater Than',
                appliesTo: ['Number']
            },
            lessThan: {
                operation: function(input) {return input[0] < input[1]},
                text: ' is Less Than',
                appliesTo: ['Number']
            },
            greaterThanOrEq: {
                operation: function (input) {return input[0] >= input[1]},
                text: 'is Greater Than or Equal To',
                appliesTo: ['Number']
            },
            lessThanOrEq: {
                operation: function (input) {return input[0] >= input[1]},
                text: 'is Less Than or Equal To',
                appliesTo: ['Number']
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

    return RuleEvaluator;
});
