define([
    'lodash'
], function (
    _
) {

    var METADATA_BY_TYPE = {
        'generator': {
            values: [
                {
                    key: "name",
                    name: "Name",
                    format: "string"
                },
                {
                    key: "utc",
                    name: "Time",
                    format: "utc",
                    hints: {
                        domain: 1
                    }
                },
                {
                    key: "yesterday",
                    name: "Yesterday",
                    format: "utc",
                    hints: {
                        domain: 2
                    }
                },
                {
                    key: "sin",
                    name: "Sine",
                    formatString: '%0.2f',
                    hints: {
                        range: 1
                    }
                },
                {
                    key: "cos",
                    name: "Cosine",
                    formatString: '%0.2f',
                    hints: {
                        range: 2
                    }
                }
            ]
        },
        'example.state-generator': {
            values: [
                {
                    key: "name",
                    name: "Name",
                    format: "string"
                },
                {
                    key: "utc",
                    name: "Time",
                    format: "utc",
                    hints: {
                        domain: 1
                    }
                },
                {
                    key: "state",
                    source: "value",
                    name: "State",
                    format: "enum",
                    enumerations: [
                        {
                            value: 0,
                            string: "OFF"
                        },
                        {
                            value: 1,
                            string: "ON"
                        }
                    ],
                    hints: {
                        range: 1
                    }
                },
                {
                    key: "value",
                    name: "Value",
                    hints: {
                        range: 2
                    }
                }
            ]
        }
    }

    function GeneratorMetadataProvider() {

    }

    GeneratorMetadataProvider.prototype.supportsMetadata = function (domainObject) {
        return METADATA_BY_TYPE.hasOwnProperty(domainObject.type);
    };

    GeneratorMetadataProvider.prototype.getMetadata = function (domainObject) {
        return _.extend(
            {},
            domainObject.telemetry,
            METADATA_BY_TYPE[domainObject.type]
        );
    };

    return GeneratorMetadataProvider;

});
