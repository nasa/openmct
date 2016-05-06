/*global define,window,console,MCT*/

/**

var key = '114ced6c-deb7-4169-ae71-68c571665514';
MCT.objects.getObject([key])
    .then(function (results) {
        console.log('got results');
        return results[key];
    })
    .then(function (domainObject) {
        console.log('got object');
        MCT.telemetry.subscribe(domainObject, function (datum) {
            console.log('gotData!', datum);
        });
    });
});


*/

define([
    'lodash',
    'eventemitter2'
], function (
    _,
    EventEmitter
) {

    // format map is a placeholder until we figure out format service.
    var FORMAT_MAP = {
        generic: function (range) {
            return function (datum) {
                return datum[range.key];
            };
        },
        enum: function (range) {
            var enumMap = _.indexBy(range.enumerations, 'value');
            return function (datum) {
                try {
                    return enumMap[datum[range.valueKey]].text;
                } catch (e) {
                    return datum[range.valueKey];
                }
            };
        }
    };

    FORMAT_MAP.number =
        FORMAT_MAP.float =
        FORMAT_MAP.integer =
        FORMAT_MAP.ascii =
        FORMAT_MAP.generic;



    function TelemetryAPI(
        formatService
    ) {

        this.formatService = formatService;

        function testAPI() {
            var key = '114ced6c-deb7-4169-ae71-68c571665514';
            window.MCT.objects.getObjects([key])
                .then(function (results) {
                    console.log('got results');
                    return results[key];
                })
                .then(function (domainObject) {
                    var formatter = new MCT.telemetry.Formatter(domainObject);
                    console.log('got object');
                    window.MCT.telemetry.subscribe(domainObject, function (datum) {
                        var formattedValues = {};
                        Object.keys(datum).forEach(function (key) {
                            formattedValues[key] = formatter.format(datum, key);
                        });
                        console.log(
                            'datum:',
                            datum,
                            'formatted:',
                            formattedValues
                        );
                    });
                });
        }

        function getFormatter(range) {
            if (FORMAT_MAP[range.type]) {
                return FORMAT_MAP[range.type](range);
            }
            try {
                var format = formatService.getFormat(range.type).format.bind(
                        formatService.getFormat(range.type)
                    ),
                    formatter = function (datum) {
                        return format(datum[range.key]);
                    };
                return formatter;
            } catch (e) {
                console.log('could not retrieve format', range, e, e.message);
                return FORMAT_MAP.generic(range);
            }
        }

        function TelemetryFormatter(domainObject) {
            this.metadata = domainObject.getCapability('telemetry').getMetadata();
            this.formats = {};
            var ranges = this.metadata.ranges.concat(this.metadata.domains);

            ranges.forEach(function (range) {
                this.formats[range.key] = getFormatter(range);
            }, this);
        }

        /**
         * Retrieve the 'key' from the datum and format it accordingly to
         * telemetry metadata in domain object.
         */
        TelemetryFormatter.prototype.format = function (datum, key) {
            return this.formats[key](datum);
        };

        function LimitEvaluator(domainObject) {
            this.domainObject = domainObject;
            this.evaluator = domainObject.getCapability('limits');

            if (!this.evaluator) {
                this.evaluator = function () {
                    return '';
                };
            }
        }

        /** TODO: Do we need a telemetry parser, or do we assume telemetry
        is numeric by default? */

        LimitEvaluator.prototype.evaluate = function (datum, key) {
            return this.evaluator(datum, key);
        };

        /** Basic telemetry collection, needs more magic. **/
        function TelemetryCollection(domainObject) {
            this.domainObject = domainObject;
            this.data = [];
        }

        _.extend(TelemetryCollection.prototype, EventEmitter.prototype);

        TelemetryCollection.prototype.request = function (options) {
            request(this.domainObject, options).then(function (data) {
                data.forEach(function (datum) {
                    this.addDatum(datum);
                }, this);
            }.bind(this));
        };

        TelemetryCollection.prototype.addDatum = function (datum) {
            this.data.push(datum);
            this.emit('add', datum);
        };

        TelemetryCollection.prototype.subscribe = function (options) {
            if (this.unsubscribe) {
                this.unsubscribe();
                delete this.unsubscribe;
            }

            this.unsubscribe = subscribe(
                this.domainObject,
                function (telemetrySeries) {
                    telemetrySeries.getData().forEach(this.addDatum, this);
                }.bind(this),
                options
            );
        };

        function registerProvider(provider) {
            // Not yet implemented.
            console.log('registering provider', provider);
        }

        function registerEvaluator(evaluator) {
            // not yet implemented.
            console.log('registering evaluator', evaluator);
        }

        function request(domainObject, options) {
            return domainObject.getCapability('telemetry')
                .requestData(options)
                .then(function (telemetrySeries) {
                    return telemetrySeries.getData();
                });
        }

        function subscribe(domainObject, callback, options) {
            return domainObject.getCapability('telemetry')
                .subscribe(function (series) {
                    series.getData().forEach(callback);
                }, options);
        }

        var Telemetry = {
            registerProvider: registerProvider,
            registerEvaluator: registerEvaluator,
            request: request,
            subscribe: subscribe,
            Formatter: TelemetryFormatter,
            LimitEvaluator: LimitEvaluator
        };

        window.MCT = window.MCT || {};
        window.MCT.telemetry = Telemetry;
        window.testAPI = testAPI;

        return Telemetry;
    }

    return TelemetryAPI;
});
