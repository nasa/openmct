/*global define,window,console*/

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
                    console.log('got object');
                    window.MCT.telemetry.subscribe(domainObject, function (datum) {
                        console.log('gotData!', datum);
                    });
                });
        }

        function TelemetryFormatter(domainObject) {
            this.domainObject = domainObject;
        }

        /**
         * Retrieve the 'key' from the datum and format it accordingly to
         * telemetry metadata in domain object.
         */
        TelemetryFormatter.prototype.format = function (datum, key) {
            console.log('formatting', datum, key);
        };

        function LimitEvaluator(domainObject) {
            this.domainObject = domainObject;
        }

        LimitEvaluator.prototype.evaluate = function (datum, key) {
            console.log('evaluating limits', datum, key);
            // evaluate limits based on metadata or third party code?
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
