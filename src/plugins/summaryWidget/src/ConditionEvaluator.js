define([], function () {

    // a module responsible for maintaining the possible operations for conditions
    // in this widget, and evaluating whether these conditions evaluate to true.
    function ConditionEvaluator(subscriptionCache) {

        this.subscriptionCache = subscriptionCache;

        // operations supported by this rule evaluator. Each rule has a method
        // with input boolean return type to be evaluated when the operation is
        // executed, a human-readable text description to populate lists in
        // the view, a key for what type it applies to, an integer number of
        // value inputs to generate, and a getDescription function that generateOptions
        // shorthand human-readable text for to desribe this operation in the rule
        // header
        this.operations = {
            equalTo: {
                operation: function (input) {
                    return input[0] === input[1];
                },
                text: 'is Equal To',
                appliesTo: ['number'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' == ' + values[0];
                }
            },
            notEqualTo: {
                operation: function (input) {
                    return input[0] !== input[1];
                },
                text: 'is Not Equal To',
                appliesTo: ['number'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' != ' + values[0];
                }
            },
            greaterThan: {
                operation: function (input) {
                    return input[0] > input[1];
                },
                text: 'is Greater Than',
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
                text: 'is Less Than',
                appliesTo: ['number'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' < ' + values[0];
                }
            },
            greaterThanOrEq: {
                operation: function (input) {
                    return input[0] >= input[1];
                },
                text: 'is Greater Than or Equal To',
                appliesTo: ['number'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' >= ' + values[0];
                }
            },
            lessThanOrEq: {
                operation: function (input) {
                    return input[0] <= input[1];
                },
                text: 'is Less Than or Equal To',
                appliesTo: ['number'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' <= ' + values[0];
                }
            },
            between: {
                operation: function (input) {
                    return input[0] > input[1] && input[0] < input[2];
                },
                text: 'is Between',
                appliesTo: ['number'],
                inputCount: 2,
                getDescription: function (values) {
                    return ' between ' + values[0] + ' and ' + values[1];
                }
            },
            notBetween: {
                operation: function (input) {
                    return input[0] < input[1] || input[0] > input[2];
                },
                text: 'is Not Between',
                appliesTo: ['number'],
                inputCount: 2,
                getDescription: function (values) {
                    return ' not between ' + values[0] + ' and ' + values[1];
                }
            },
            textContains: {
                operation: function (input) {
                    return input[0] && input[1] && input[0].includes(input[1]);
                },
                text: 'Text Contains',
                appliesTo: ['string'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' contains ' + values[0];
                }
            },
            textDoesNotContain: {
                operation: function (input) {
                    return input[0] && input[1] && !input[0].includes(input[1]);
                },
                text: 'Text Does Not Contain',
                appliesTo: ['string'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' does not contain ' + values[0];
                }
            },
            textStartsWith: {
                operation: function (input) {
                    return input[0].startsWith(input[1]);
                },
                text: 'Text Starts With',
                appliesTo: ['string'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' starts with ' + values[0];
                }
            },
            textEndsWith: {
                operation: function (input) {
                    return input[0].endsWith(input[1]);
                },
                text: 'Text Ends With',
                appliesTo: ['string'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' ends with ' + values[0];
                }
            },
            textIsExactly: {
                operation: function (input) {
                    return input[0] === input[1];
                },
                text: 'Text is Exactly',
                appliesTo: ['string'],
                inputCount: 1,
                getDescription: function (values) {
                    return ' is exactly ' + values[0];
                }
            },
            isUndefined: {
                operation: function (input) {
                    return typeof input[0] === 'undefined';
                },
                text: 'is Undefined',
                appliesTo: ['string', 'number'],
                inputCount: 0,
                getDescription: function () {
                    return 'is undefined';
                }
            }
        };
    }

    // evaluate the conditions passed in as an argument, and return whether these
    // conditions evaluate to true
    // mode: if 'any', || all conditions; if 'all', && all conditions; if 'js',
    // evaluate the conditions as JavaScript
    ConditionEvaluator.prototype.execute = function (conditions, mode) {
        var active = false,
            telemetryValue,
            operation,
            input,
            self = this,
            firstRuleEvaluated = false;

        //if (mode === 'js') {
        //TODO: implement JavaScript conditional input
        //}
        (conditions || []).forEach(function (condition) {
            telemetryValue = self.subscriptionCache[condition.object] &&
                             self.subscriptionCache[condition.object][condition.key] &&
                             [self.subscriptionCache[condition.object][condition.key]];
            operation = self.operations[condition.operation] &&
                        self.operations[condition.operation].operation;
            input = telemetryValue && telemetryValue.concat(condition.values);

            if (operation && input) {
                active = (mode === 'all' && !firstRuleEvaluated ? true : active);
                firstRuleEvaluated = true;
                if (mode === 'any') {
                    active = active || operation(input);
                } else if (mode === 'all') {
                    active = active && operation(input);
                }
            }
        });
        return active;
    };

    ConditionEvaluator.prototype.getOperationKeys = function () {
        return Object.keys(this.operations);
    };

    ConditionEvaluator.prototype.getOperationText = function (key) {
        return this.operations[key].text;
    };

    ConditionEvaluator.prototype.operationAppliesTo = function (key, type) {
        return (this.operations[key].appliesTo.includes(type));
    };

    ConditionEvaluator.prototype.getInputCount = function (key) {
        if (this.operations[key]) {
            return this.operations[key].inputCount;
        }
    };

    ConditionEvaluator.prototype.getOperationType = function (key) {
        if (this.operations[key]) {
            return this.operations[key].appliesTo[0];
        }
    };

    ConditionEvaluator.prototype.getOperationDescription = function (key, values) {
        if (this.operations[key]) {
            return this.operations[key].getDescription(values);
        }
    };

    return ConditionEvaluator;
});
