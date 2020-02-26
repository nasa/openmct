export default class ConditionSetMetadataProvider {
    constructor(openmct) {
        this.openmct = openmct;
    }

    supportsMetadata(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    getDomains(domainObject) {
        return this.openmct.time.getAllTimeSystems().map(function (ts, i) {
            return {
                key: ts.key,
                name: ts.name,
                format: ts.timeFormat,
                hints: {
                    domain: i
                }
            };
        });
    }

    getMetadata(domainObject) {
        return {
            values: this.getDomains().concat([
                {
                    name: 'Output',
                    key: 'output',
                    format: 'string',
                    hints: {
                        range: 1
                    }
                }
            ])
        };
    }
}
