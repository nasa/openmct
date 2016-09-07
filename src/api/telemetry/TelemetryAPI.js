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

    /**
     * Describes a property which would be found in a datum of telemetry
     * associated with a particular domain object.
     *
     * @typedef TelemetryProperty
     * @memberof module:openmct.TelemetryAPI~
     * @property {string} key the name of the property in the datum which
     *           contains this telemetry value
     * @property {string} name the human-readable name for this property
     * @property {string} units the units associated with this property
     * @property {boolean} [temporal] true if this property is a timestamp, or
     *           may be otherwise used to order telemetry in a time-like
     *           fashion; default is false
     * @property {boolean} [numeric] true if the values for this property
     *           can be interpreted plainly as numbers; default is true
     * @property {boolean} [enumerated] true if this property may have only
     *           certain specific values; default is false
     * @property {string} [values] for enumerated states, an ordered list
     *           of possible values
     */

    /**
     * Describes and bounds requests for telemetry data.
     *
     * @typedef TelemetryRequest
     * @memberof module:openmct.TelemetryAPI~
     * @property {string} sort the key of the property to sort by
     * @property {*} start the lower bound for values of the sorting property
     * @property {*} end the upper bound for values of the sorting property
     * @property {string[]} strategies symbolic identifiers for strategies
     *           (such as `minmax`) which may be recognized by providers;
     *           these will be tried in order until an appropriate provider
     *           is found
     */

    /**
     * An interface for retrieving telemetry data associated with a domain
     * object.
     * @interface TelemetryAPI
     * @memberof module:openmct
     */
    function TelemetryAPI(
        formatService
    ) {

        var FORMATTER_CACHE = new WeakMap(),
            EVALUATOR_CACHE = new WeakMap();

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

        /**
         * A TelemetryFormatter converts telemetry values for purposes of
         * display as text.
         *
         * @interface TelemetryFormatter
         * @memberof module:openmct.TelemetryAPI~
         */
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
         *
         * @method format
         * @memberof module:openmct.TelemetryAPI~TelemetryFormatter#
         */
        TelemetryFormatter.prototype.format = function (datum, key) {
            return this.formats[key](datum);
        };

        /**
         * A LimitEvaluator may be used to detect when telemetry values
         * have exceeded nominal conditions.
         *
         * @interface LimitEvaluator
         * @memberof module:openmct.TelemetryAPI~
         */
        function LimitEvaluator(domainObject) {
            this.domainObject = domainObject;
            this.evaluator = domainObject.getCapability('limit');
            if (!this.evaluator) {
                this.evalute = function () {
                    return '';
                }
            }
        }

        /** TODO: Do we need a telemetry parser, or do we assume telemetry
        is numeric by default? */

        /**
         * Check if any limits have been exceeded.
         *
         * @param {*} datum a telemetry datum
         * @param {string} key the name of the property to be evaluated
         *        for limit violation
         * @returns {string[]} an array of limit exceedance states
         * @memberof module:openmct.TelemetryAPI~TelemetryFormatter#
         */
        LimitEvaluator.prototype.evaluate = function (datum, key) {
            return this.evaluator.evaluate(datum, key);
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

        function registerProvider(provider, strategy) {
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
            /**
             * Register a telemetry provider with the telemetry service. This
             * allows you to connect alternative telemetry sources.
             * @method registerProvider
             * @memberof module:openmct.TelemetryAPI#
             * @param {module:openmct.TelemetryProvider} provider the new
             *        telemetry provider
             * @param {string} [strategy] the request strategy supported by
             *        this provider. If omitted, this will be used as a
             *        default provider (when no strategy is requested or no
             *        matching strategy is found.)
             */
            registerProvider: registerProvider,

            /**
             * Register a new limit evaluator.
             * @method registerEvaluator
             * @memberof module:openmct.TelemetryAPI#
             * @param {module:openmct.LimitEvaluatorProvider} provider the
             *        new limit evaluator
             */
            registerEvaluator: registerEvaluator,

            /**
             * Request historical telemetry for a domain object.
             * The `options` argument allows you to specify filters
             * (start, end, etc.), sort order, and strategies for retrieving
             * telemetry (aggregation, latest available, etc.).
             *
             * @method request
             * @memberof module:openmct.TelemetryAPI#
             * @param {module:openmct.DomainObject} domainObject the object
             *        which has associated telemetry
             * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
             *        options for this historical request
             */
            request: request,

            /**
             * Subscribe to realtime telemetry for a specific domain object.
             * The callback will be called whenever data is received from a
             * realtime provider.
             *
             * @method subscribe
             * @memberof module:openmct.TelemetryAPI#
             * @param {module:openmct.DomainObject} domainObject the object
             *        which has associated telemetry
             * @param {Function} callback the callback to invoke with new data, as
             *        it becomes available
             * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
             *        options for this request
             */
            subscribe: subscribe,

            /**
             * Get a list of all telemetry properties defined for this
             * domain object.
             *
             * @param {module:openmct.DomainObject} domainObject the domain
             *        object for which to request telemetry
             * @returns {module:openmct.TelemetryAPI~TelemetryProperty[]}
             *          telemetry metadata
             * @method getMetadata
             * @memberof module:openmct.TelemetryAPI#
             */
            properties: function (domainObject) {
                return domainObject.getCapability('telemetry').getMetadata();
            },

            /**
             * Telemetry formatters help you format telemetry values for
             * display. Under the covers, they use telemetry metadata to
             * interpret your telemetry data, and then they use the format API
             * to format that data for display.
             *
             * @param {module:openmct.DomainObject} domainObject the domain
             *        object for which to format telemetry
             * @returns {module:openmct.TelemetryAPI~TelemetryFormatter}
             * @method formatter
             * @memberof module:openmct.TelemetryAPI#
             */
            Formatter: function (domainObject) {
                if (!FORMATTER_CACHE.has(domainObject)) {
                    FORMATTER_CACHE.set(
                        domainObject,
                        new TelemetryFormatter(domainObject)
                    );
                }
                return FORMATTER_CACHE.get(domainObject);
            },

            /**
             * Get a limit evaluator for this domain object.
             * Limit Evaluators help you evaluate limit and alarm status of individual telemetry datums for display purposes without having to interact directly with the Limit API.
             *
             * @param {module:openmct.DomainObject} domainObject the domain
             *        object for which to evaluate limits
             * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
             * @method limitEvaluator
             * @memberof module:openmct.TelemetryAPI#
             */
            LimitEvaluator: function (domainObject) {
                if (!EVALUATOR_CACHE.has(domainObject)) {
                    EVALUATOR_CACHE.set(
                        domainObject,
                        new LimitEvaluator(domainObject)
                    );
                }
                return EVALUATOR_CACHE.get(domainObject);
            }
        };

        window.MCT = window.MCT || {};
        window.MCT.telemetry = Telemetry;
        window.testAPI = testAPI;

        return Telemetry;
    }

    return TelemetryAPI;
});
