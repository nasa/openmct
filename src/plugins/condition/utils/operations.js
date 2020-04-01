/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import _ from 'lodash';

export const OPERATIONS = [
    {
        name: 'equalTo',
        operation: function (input) {
            return Number(input[0]) === Number(input[1]);
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
            return Number(input[0]) !== Number(input[1]);
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
            return Number(input[0]) > Number(input[1]);
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
            return Number(input[0]) < Number(input[1]);
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
            return Number(input[0]) >= Number(input[1]);
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
            return Number(input[0]) <= Number(input[1]);
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
            let numberInputs = [];
            input.forEach(inputValue => numberInputs.push(Number(inputValue)));
            let larger = Math.max(...numberInputs.slice(1,3));
            let smaller = Math.min(...numberInputs.slice(1,3));
            return (numberInputs[0] > smaller) && (numberInputs[0] < larger);
        },
        text: 'is between',
        appliesTo: ['number'],
        inputCount: 2,
        getDescription: function (values) {
            return ' is between ' + values[0] + ' and ' + values[1];
        }
    },
    {
        name: 'notBetween',
        operation: function (input) {
            let numberInputs = [];
            input.forEach(inputValue => numberInputs.push(Number(inputValue)));
            let larger = Math.max(...numberInputs.slice(1,3));
            let smaller = Math.min(...numberInputs.slice(1,3));
            return (numberInputs[0] < smaller) || (numberInputs[0] > larger);
        },
        text: 'is not between',
        appliesTo: ['number'],
        inputCount: 2,
        getDescription: function (values) {
            return ' is not between ' + values[0] + ' and ' + values[1];
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
    },
    {
        name: 'valueIs',
        operation: function (input) {
            if (input[1]) {
                const values = input[1].split(',');
                return values.find((value) => input[0].toString() === _.trim(value.toString()));
            }
            return false;
        },
        text: 'is one of',
        appliesTo: ["string", "number"],
        inputCount: 1,
        getDescription: function (values) {
            return ' is one of ' + values[0];
        }
    },
    {
        name: 'valueIsNot',
        operation: function (input) {
            if (input[1]) {
                const values = input[1].split(',');
                const found = values.find((value) => input[0].toString() === _.trim(value.toString()));
                return !found;
            }
            return false;
        },
        text: 'is not one of',
        appliesTo: ["string", "number"],
        inputCount: 1,
        getDescription: function (values) {
            return ' is not one of ' + values[0];
        }
    }
];

export const INPUT_TYPES = {
    'string': 'text',
    'number': 'number'
};
