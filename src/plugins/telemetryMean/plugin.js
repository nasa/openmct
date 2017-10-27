define(['./src/TelemetryMeanProvider'], 
    function (TelemetryMeanProvider) {
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

            function MeanObjectProvider (openmct) {
                this.objectApi = openmct.objects;
                this.defaultProvider = this.objectApi.fallbackProvider;
            }

            MeanObjectProvider.prototype.save = function (object) {
                var telemetryPoint = object.telemetryPoint;
                if (telemetryPoint) {
                    return this.defaultProvider.get(object.identifier).then(function (wrappedObject){
                        object.telemetry.values = wrappedObject.telemetry.values;
                        object.telemetry.values.map(function (value){
                            return value.name = value.name + " (Mean)";
                        });
                        return object
                    }.bind(this)).then(function (object) {
                        return this.defaultProvider.save(object);
                    }.bind(this))
                } else {
                    object.telemetry = {
                        values: []
                    };
                    return this.defaultProvider.save(object);
                }
            };

            MeanObjectProvider.prototype.get = function (identifier) {
                return this.defaultProvider.get(identifier);
            };

            MeanObjectProvider.prototype.delete = function (object) {
                return this.defaultProvider.delete(identifier);
            };

            openmct.objects.addProvider('object-mean', new MeanObjectProvider(openmct));
        };
    }

    return plugin;
});
