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
                name: 'Telemetry Mean',
                description: 'Provides telemetry values that represent the mean of the last N values of a telemetry stream',
                creatable: true,
                cssClass: 'icon-telemetry',
                initialize: function (domainObject) {
                    domainObject.samples = DEFAULT_SAMPLES;
                    domainObject.telemetry = {
                        values: []
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

            openmct.legacyExtension('components', {
                type: 'decorator',
                provides: 'actionService',
                depends: ['openmct'],
                implementation: TelemetryMeanActionDecorator
            })
        };
    }

    return plugin;
});
