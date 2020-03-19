export const OPERATIONS = [
    {
        name: 'equalTo',
        operation: function (input) {
            return input[0] === input[1];
        },
        text: 'is equal to',
        appliesTo: ['number'],
        inputCount: 1,
        getDescription: function (values) {
            return ' is ' + values.join(', ');
        }
    },
    {
        name: 'notEqualTo',
        operation: function (input) {
            return input[0] !== input[1];
        },
        text: 'is not equal to',
        appliesTo: ['number'],
        inputCount: 1,
        getDescription: function (values) {
            return ' is not ' + values.join(', ');
        }
    },
    {
        name: 'greaterThan',
        operation: function (input) {
            return input[0] > input[1];
        },
        text: 'is greater than',
        appliesTo: ['number'],
        inputCount: 1,
        getDescription: function (values) {
            return ' > ' + values.join(', ');
        }
    },
    {
        name: 'lessThan',
        operation: function (input) {
            return input[0] < input[1];
        },
        text: 'is less than',
        appliesTo: ['number'],
        inputCount: 1,
        getDescription: function (values) {
            return ' < ' + values.join(', ');
        }
    },
    {
        name: 'greaterThanOrEq',
        operation: function (input) {
            return input[0] >= input[1];
        },
        text: 'is greater than or equal to',
        appliesTo: ['number'],
        inputCount: 1,
        getDescription: function (values) {
            return ' >= ' + values.join(', ');
        }
    },
    {
        name: 'lessThanOrEq',
        operation: function (input) {
            return input[0] <= input[1];
        },
        text: 'is less than or equal to',
        appliesTo: ['number'],
        inputCount: 1,
        getDescription: function (values) {
            return ' <= ' + values.join(', ');
        }
    },
    {
        name: 'between',
        operation: function (input) {
            return input[0] > input[1] && input[0] < input[2];
        },
        text: 'is between',
        appliesTo: ['number'],
        inputCount: 2,
        getDescription: function (values) {
            return ' is between ' + values.join(', ') + ' and ' + values[1];
        }
    },
    {
        name: 'notBetween',
        operation: function (input) {
            return input[0] < input[1] || input[0] > input[2];
        },
        text: 'is not between',
        appliesTo: ['number'],
        inputCount: 2,
        getDescription: function (values) {
            return ' is not between ' + values.join(', ') + ' and ' + values[1];
        }
    },
    {
        name: 'textContains',
        operation: function (input) {
            return input[0] && input[1] && input[0].includes(input[1]);
        },
        text: 'text contains',
        appliesTo: ['string'],
        inputCount: 1,
        getDescription: function (values) {
            return ' contains ' + values.join(', ');
        }
    },
    {
        name: 'textDoesNotContain',
        operation: function (input) {
            return input[0] && input[1] && !input[0].includes(input[1]);
        },
        text: 'text does not contain',
        appliesTo: ['string'],
        inputCount: 1,
        getDescription: function (values) {
            return ' does not contain ' + values.join(', ');
        }
    },
    {
        name: 'textStartsWith',
        operation: function (input) {
            return input[0].startsWith(input[1]);
        },
        text: 'text starts with',
        appliesTo: ['string'],
        inputCount: 1,
        getDescription: function (values) {
            return ' starts with ' + values.join(', ');
        }
    },
    {
        name: 'textEndsWith',
        operation: function (input) {
            return input[0].endsWith(input[1]);
        },
        text: 'text ends with',
        appliesTo: ['string'],
        inputCount: 1,
        getDescription: function (values) {
            return ' ends with ' + values.join(', ');
        }
    },
    {
        name: 'textIsExactly',
        operation: function (input) {
            return input[0] === input[1];
        },
        text: 'text is exactly',
        appliesTo: ['string'],
        inputCount: 1,
        getDescription: function (values) {
            return ' is exactly ' + values.join(', ');
        }
    },
    {
        name: 'isUndefined',
        operation: function (input) {
            return typeof input[0] === 'undefined';
        },
        text: 'is undefined',
        appliesTo: ['string', 'number', 'enum'],
        inputCount: 0,
        getDescription: function () {
            return ' is undefined';
        }
    },
    {
        name: 'isDefined',
        operation: function (input) {
            return typeof input[0] !== 'undefined';
        },
        text: 'is defined',
        appliesTo: ['string', 'number', 'enum'],
        inputCount: 0,
        getDescription: function () {
            return ' is defined';
        }
    },
    {
        name: 'enumValueIs',
        operation: function (input) {
            return input[0] === input[1];
        },
        text: 'is',
        appliesTo: ['enum'],
        inputCount: 1,
        getDescription: function (values) {
            return ' is ' + values.join(', ');
        }
    },
    {
        name: 'enumValueIsNot',
        operation: function (input) {
            return input[0] !== input[1];
        },
        text: 'is not',
        appliesTo: ['enum'],
        inputCount: 1,
        getDescription: function (values) {
            return ' is not ' + values.join(', ');
        }
    }
];
