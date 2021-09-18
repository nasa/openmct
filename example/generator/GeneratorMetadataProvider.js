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
                    key: "cos",
                    name: "Cosine",
                    unit: "deg",
                    formatString: '%0.2f',
                    hints: {
                        domain: 3
                    }
                },
                // Need to enable "LocalTimeSystem" plugin to make use of this
                // {
                //     key: "local",
                //     name: "Time",
                //     format: "local-format",
                //     source: "utc",
                //     hints: {
                //         domain: 3
                //     }
                // },
                {
                    key: "sin",
                    name: "Sine",
                    unit: "Hz",
                    formatString: '%0.2f',
                    hints: {
                        range: 1
                    }
                },
                {
                    key: "cos",
                    name: "Cosine",
                    unit: "deg",
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
                    key: "local",
                    name: "Time",
                    format: "utc",
                    source: "utc",
                    hints: {
                        domain: 2
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
        },
        'example.spectral-generator': {
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
                    key: "wavelength",
                    name: "Wavelength",
                    unit: "Hz",
                    formatString: '%0.2f',
                    hints: {
                        domain: 2,
                        spectralAttribute: true
                    }
                },
                {
                    key: "cos",
                    name: "Cosine",
                    unit: "deg",
                    formatString: '%0.2f',
                    hints: {
                        range: 2,
                        spectralAttribute: true
                    }
                }
            ]
        },
        'example.spectral-aggregate-generator': {
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
                    key: "ch1",
                    name: "Channel 1",
                    format: "string",
                    hints: {
                        range: 1
                    }
                },
                {
                    key: "ch2",
                    name: "Channel 2",
                    format: "string",
                    hints: {
                        range: 2
                    }
                },
                {
                    key: "ch3",
                    name: "Channel 3",
                    format: "string",
                    hints: {
                        range: 3
                    }
                },
                {
                    key: "ch4",
                    name: "Channel 4",
                    format: "string",
                    hints: {
                        range: 4
                    }
                },
                {
                    key: "ch5",
                    name: "Channel 5",
                    format: "string",
                    hints: {
                        range: 5
                    }
                }
            ]
        }
    };

    function GeneratorMetadataProvider() {

    }

    GeneratorMetadataProvider.prototype.supportsMetadata = function (domainObject) {
        return Object.prototype.hasOwnProperty.call(METADATA_BY_TYPE, domainObject.type);
    };

    GeneratorMetadataProvider.prototype.getMetadata = function (domainObject) {
        return Object.assign(
            {},
            domainObject.telemetry,
            METADATA_BY_TYPE[domainObject.type]
        );
    };

    return GeneratorMetadataProvider;

});
