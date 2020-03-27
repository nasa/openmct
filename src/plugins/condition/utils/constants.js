export const TRIGGER = {
    ANY: 'any',
    ALL: 'all',
    NOT: 'not',
    XOR: 'xor'
};

export const TRIGGER_LABEL = {
    'any': 'when any criteria are met',
    'all': 'when all criteria are met',
    'not': 'when no criteria are met',
    'xor': 'when only one criteria is met'
};

export const STYLE_CONSTANTS = {
    isStyleInvisible: 'is-style-invisible',
    borderColorTitle: 'Set border color',
    textColorTitle: 'Set text color',
    backgroundColorTitle: 'Set background color',
    imagePropertiesTitle: 'Edit image properties',
    visibilityHidden: 'Hidden',
    visibilityVisible: 'Visible'
};

export const ERROR = {
    'TELEMETRY_NOT_FOUND': {
        errorText: 'Telemetry not found for criterion'
    },
    'CONDITION_NOT_FOUND': {
        errorText: 'Condition not found'
    }
};
