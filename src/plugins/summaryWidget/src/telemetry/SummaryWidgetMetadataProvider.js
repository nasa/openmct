define([

], function (

) {

    function SummaryWidgetMetadataProvider(openmct) {
        this.openmct = openmct;
    }

    SummaryWidgetMetadataProvider.prototype.appliesTo = function (domainObject) {
        return domainObject.type === 'summary-widget';
    };

    SummaryWidgetMetadataProvider.prototype.getDomains = function (domainObject) {
        return this.openmct.time.getAllTimeSystems().map(function (ts, i) {
            return {
                key: ts.key,
                name: 'UTC',
                format: ts.timeFormat,
                hints: {
                    domain: i
                }
            };
        });
    };

    SummaryWidgetMetadataProvider.prototype.getMetadata = function (domainObject) {
        var ruleOrder = domainObject.configuration.ruleOrder || [];
        var enumerations = ruleOrder
            .filter(function (ruleId) {
                return !!domainObject.configuration.ruleConfigById[ruleId];
            })
            .map(function (ruleId, ruleIndex) {
                return {
                    string: domainObject.configuration.ruleConfigById[ruleId].label,
                    value: ruleIndex
                };
            });

        var metadata = {
            // Generally safe assumption is that we have one domain per timeSystem.
            values: this.getDomains().concat([
                {
                    name: 'state',
                    key: 'state',
                    source: 'ruleIndex',
                    format: 'enum',
                    enumerations: enumerations,
                    hints: {
                        range: 1
                    }
                },
                {
                    name: 'Rule Label',
                    key: 'ruleLabel',
                    format: 'string'
                },
                {
                    name: 'Rule Name',
                    key: 'ruleName',
                    format: 'string'
                },
                {
                    name: 'Message',
                    key: 'message',
                    format: 'string'
                },
                {
                    name: 'Background Color',
                    key: 'backgroundColor',
                    format: 'string'
                },
                {
                    name: 'Text Color',
                    key: 'textColor',
                    format: 'string'
                },
                {
                    name: 'Border Color',
                    key: 'borderColor',
                    format: 'string'
                },
                {
                    name: 'Display Icon',
                    key: 'icon',
                    format: 'string'
                }
            ])
        };

        return metadata;
    };

    return SummaryWidgetMetadataProvider;

});
