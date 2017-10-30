define([
    './src/TelemetryMeanProvider',
    './src/TelemetryMeanActionDecorator'
], 
    function (
        TelemetryMeanProvider, TelemetryMeanActionDecorator) {
    var DEFAULT_SAMPLES = 10;

    function plugin() {
        return function install(openmct) {
            openmct.types.addType('telemetry-mean', {
                name: 'Telemetry Filter',
                description: 'Provides telemetry values that represent the mean of the last N values of a telemetry stream',
                creatable: true,
                cssClass: 'icon-telemetry',
                initialize: function (domainObject) {
                    domainObject.samples = DEFAULT_SAMPLES;
                    domainObject.telemetry = {
                        values: [
                            {
                                key: "utc",
                                name: "Time",
                                format: "utc",
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                key: "value",
                                name: "Value",
                                hints: {
                                    range: 1
                                }
                            }
                        ]
                    }
                },
                form: [
                    {
                        "key": "telemetryPoint",
                        "name": "Telemetry Point",
                        "control": "textfield",
                        "required": true,
                        "cssClass": "l-input-lg"
                    },
                    {
                        "key": "samples",
                        "name": "Samples to Average",
                        "control": "textfield",
                        "required": true,
                        "cssClass": "l-input-sm"
                    }
                ]    
            });
            openmct.telemetry.addProvider(new TelemetryMeanProvider(openmct));
        };
    }

    return plugin;
});
