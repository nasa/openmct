export default class ISOTimeFormat {
    constructor() {
        this.key = 'iso';
    }

    format(value) {
        if (value !== undefined) {
            return new Date(value).toISOString();
        } else {
            return value;
        }
    }

    parse(text) {
        if (typeof text === 'number' || text === undefined) {
            return text;
        }
        return Date.parse(text);
    }

    validate(text) {
        return !isNaN(Date.parse(text));
    }
}