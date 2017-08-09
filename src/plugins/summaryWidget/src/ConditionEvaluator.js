define([], function () {

    // a module responsible for maintaining the possible operations for conditions
    // in this widget, and evaluating the boolean value of the conditions
    function ConditionEvaluator(subscriptionCache, compositionObjs) {

        this.subscriptionCache = subscriptionCache;
        this.compositionObjs = compositionObjs;

        //the HTML input type to generate corresponding to the input value(s) a
        //condition expects
        this.inputTypes = {
            number: 'number',
            string: 'text'
        };

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
            conditionValue,
            conditionDefined = false,
            self = this,
            firstRuleEvaluated = false,
            compositionObjs = this.compositionObjs;

        //if (mode === 'js') {
        //TODO: implement JavaScript conditional input
        //}
        (conditions || []).forEach(function (condition) {
            if (condition.object === 'any') {
                conditionValue = false;
                Object.keys(compositionObjs).forEach(function (objId) {
                    try {
                        conditionValue = conditionValue ||
                            self.executeCondition(objId, condition.key,
                                condition.operation, condition.values);
                        conditionDefined = true;
                    } catch (e) {
                        //ignore a malformed condition
                    }
                });
            } else if (condition.object === 'all') {
                conditionValue = true;
                Object.keys(compositionObjs).forEach(function (objId) {
                    try {
                        conditionValue = conditionValue &&
                            self.executeCondition(objId, condition.key,
                                condition.operation, condition.values);
                        conditionDefined = true;
                    } catch (e) {
                        //ignore a malformed condition
                    }
                });
            } else {
                try {
                    conditionValue = self.executeCondition(condition.object, condition.key,
                        condition.operation, condition.values);
                    conditionDefined = true;
                } catch (e) {
                    //ignore malformed condition
                }
            }

            if (conditionDefined) {
                active = (mode === 'all' && !firstRuleEvaluated ? true : active);
                firstRuleEvaluated = true;
                if (mode === 'any') {
                    active = active || conditionValue;
                } else if (mode === 'all') {
                    active = active && conditionValue;
                }
            }
        });
        return active;
    };

    ConditionEvaluator.prototype.executeCondition = function (object, key, operation, values) {
        var telemetryValue = this.subscriptionCache[object] &&
                         this.subscriptionCache[object][key] &&
                         [this.subscriptionCache[object][key]],
        op = this.operations[operation] &&
                    this.operations[operation].operation,
        input = telemetryValue && telemetryValue.concat(values);

        if (op && input) {
            return op(input);
        } else {
            throw new Error('Malformed condition');
        }
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

    ConditionEvaluator.prototype.getInputType = function (key) {
        var type;
        if (this.operations[key]) {
            type = this.operations[key].appliesTo[0];
        }
        if (this.inputTypes[type]) {
            return this.inputTypes[type];
        }
    };

    return ConditionEvaluator;
});
