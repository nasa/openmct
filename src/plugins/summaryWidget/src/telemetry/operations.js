define([

], function (

) {
    var OPERATIONS = {
        equalTo: {
            operation: function (input) {
                return input[0] === input[1];
            },
            text: 'is equal to',
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
            text: 'is not equal to',
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
            inputCount: 1,
            getDescription: function (values) {
                return ' < ' + values[0];
            }
        },
        greaterThanOrEq: {
            operation: function (input) {
                return input[0] >= input[1];
            },
            text: 'is greater than or equal to',
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
            text: 'is less than or equal to',
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
            text: 'is between',
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
            text: 'is not between',
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
            text: 'text contains',
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
            text: 'text does not contain',
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
            text: 'text starts with',
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
            text: 'text ends with',
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
            text: 'text is exactly',
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
            text: 'is undefined',
            appliesTo: ['string', 'number'],
            inputCount: 0,
            getDescription: function () {
                return ' is undefined';
            }
        },
        isDefined: {
            operation: function (input) {
                return typeof input[0] !== 'undefined';
            },
            text: 'is defined',
            appliesTo: ['string', 'number'],
            inputCount: 0,
            getDescription: function () {
                return ' is defined';
            }
        }
    };

    return OPERATIONS;
});
