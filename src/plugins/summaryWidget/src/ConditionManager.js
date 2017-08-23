define ([
    './ConditionEvaluator',
    'EventEmitter',
    'lodash'
], function (
    ConditionEvaluator,
    EventEmitter,
    _
) {

    /**
     * Provides a centralized content manager for conditions in the summary widget.
     * Loads and caches composition and telemetry subscriptions, and maintains a
     * {ConditionEvaluator} instance to handle evaluation
     * @constructor
     * @param {Object} domainObject the Summary Widget domain object
     * @param {MCT} openmct an MCT instance
     */
    function ConditionManager(domainObject, openmct) {
        var self = this;

        this.domainObject = domainObject;
        this.openmct = openmct;

        this.composition = this.openmct.composition.get(this.domainObject);
        this.compositionObjs = {};
        this.eventEmitter = new EventEmitter();
        this.supportedCallbacks = ['add', 'remove', 'load', 'metadata', 'receiveTelemetry'];

        this.keywordLabels = {
            any: 'Any Telemetry',
            all: 'All Telemetry'
        };

        this.telemetryMetadataById = {
            any: {},
            all: {}
        };

        this.telemetryTypesById = {
            any: {},
            all: {}
        };

        this.subscriptions = {};
        this.subscriptionCache = {};
        this.loadComplete = false;
        this.metadataLoadComplete = false;
        this.evaluator = new ConditionEvaluator(this.subscriptionCache, this.compositionObjs);

        /**
         * Adds a field to the list of all available metadata fields in the widget
         * @param {Object} metadatum An object representing a set of telemetry metadata
         * @private
         */
        function addGlobalMetadata(metadatum) {
            self.telemetryMetadataById.any[metadatum.key] = metadatum;
            self.telemetryMetadataById.all[metadatum.key] = metadatum;
        }

        /**
         * Adds a field to the list of properties for globally available metadata
         * @param {string} key The key for the property this type applies to
         * @param {string} type The type that should be associated with this property
         * @private
         */
        function addGlobalPropertyType(key, type) {
            self.telemetryTypesById.any[key] = type;
            self.telemetryTypesById.all[key] = type;
        }

        /**
         * Given a telemetry-producing domain object, associate each of it's telemetry
         * fields with a type, parsing from historical data.
         * @param {Object} object a domain object that can produce telemetry
         * @return {Promise} A promise that resolves when a telemetry request
         *                   has completed and types have been parsed
         * @private
         */
        function getPropertyTypes(object) {
            var telemetryAPI = self.openmct.telemetry,
                key,
                type;

            self.telemetryTypesById[object.identifier.key] = {};

            return telemetryAPI.request(object, {}).then(function (telemetry) {
                Object.entries(telemetry[0]).forEach(function (telem) {
                    key = telem[0];
                    type = typeof telem[1];
                    self.telemetryTypesById[object.identifier.key][key] = type;
                    addGlobalPropertyType(key, type);
                });
            });
        }

        /**
         * Once the intial composition load has completed, parse all telemetry fields
         * from all composition objects
         * @return {Promise} A promise that resolves when all metadata has been loaded
         *                   and property types parsed
         * @private
         */
        function loadMetadata() {
            var index = 0,
                objs = Object.values(self.compositionObjs),
                promise = new Promise(function (resolve, reject) {
                    if (objs.length === 0) {
                        resolve();
                    }
                    objs.forEach(function (obj) {
                        getPropertyTypes(obj).then(function () {
                            if (index === objs.length - 1) {
                                resolve();
                            }
                            index += 1;
                        });
                    });
                });
            return promise;
        }

        /**
         * Invoked when a telemtry subscription yields new data. Updates the LAD
         * cache and invokes any registered receiveTelemetry callbacks
         * @param {string} objId The key associated with the telemetry source
         * @param {datum} datum The new data from the telemetry source
         * @private
         */
        function handleSubscriptionCallback(objId, datum) {
            self.subscriptionCache[objId] = datum;
            self.eventEmitter.emit('receiveTelemetry');
        }

        /**
         * Event handler for an add event in this Summary Widget's composition.
         * Sets up subscription handlers and parses its property types.
         * @private
         */
        function onCompositionAdd(obj) {
            var compositionKeys,
                telemetryAPI = self.openmct.telemetry,
                objId = obj.identifier.key,
                telemetryMetadata;

            if (telemetryAPI.canProvideTelemetry(obj)) {
                self.compositionObjs[objId] = obj;
                self.telemetryMetadataById[objId] = {};

                compositionKeys = self.domainObject.composition.map(function (object) {
                    return object.key;
                });
                if (!compositionKeys.includes(obj.identifier.key)) {
                    self.domainObject.composition.push(obj.identifier);
                }

                telemetryMetadata = telemetryAPI.getMetadata(obj).values();
                telemetryMetadata.forEach(function (metaDatum) {
                    self.telemetryMetadataById[objId][metaDatum.key] = metaDatum;
                    addGlobalMetadata(metaDatum);
                });

                self.subscriptionCache[objId] = {};
                self.subscriptions[objId] = telemetryAPI.subscribe(obj, function (datum) {
                    handleSubscriptionCallback(objId, datum);
                }, {});

                //if this is the initial load, postpose loading metadata so event handlers
                //fire properly
                if (self.loadComplete) {
                    getPropertyTypes(obj);
                }

                self.eventEmitter.emit('add', obj);
            }
        }

        /**
         * Invoked in a remove event in this Summary Widget's compostion. Removes
         * the object from the local composition, and untracks it
         * @param {object} identifier The identifier of the object to be removed
         * @private
         */
        function onCompositionRemove(identifier) {
            _.remove(self.domainObject.composition, function (id) {
                return id.key === identifier.key;
            });
            delete self.compositionObjs[identifier.key];
            self.subscriptions[identifier.key](); //unsubscribe from telemetry source
            self.eventEmitter.emit('remove', identifier);
        }

        /**
         * Invoked when the Summary Widget's composition finishes its initial load.
         * Invokes any registered load callbacks, does a block load of all metadata,
         * and then invokes any registered metadata load callbacks.
         * @private
         */
        function onCompositionLoad() {
            self.loadComplete = true;
            self.eventEmitter.emit('load');
            loadMetadata().then(function () {
                self.metadataLoadComplete = true;
                self.eventEmitter.emit('metadata');
            });
        }

        this.composition.on('add', onCompositionAdd, this);
        this.composition.on('remove', onCompositionRemove, this);
        this.composition.on('load', onCompositionLoad, this);

        this.composition.load();
    }

    /**
     * Register a callback with this ConditionManager: supported callbacks are add
     * remove, load, metadata, and receiveTelemetry
     * @param {string} event The key for the event to listen to
     * @param {function} callback The function that this rule will envoke on this event
     * @param {Object} context A reference to a scope to use as the context for
     *                         context for the callback function
     */
    ConditionManager.prototype.on = function (event, callback, context) {
        if (this.supportedCallbacks.includes(event)) {
            this.eventEmitter.on(event, callback, context || this);
        }
    };

    /**
     * Given a set of rules, execute the conditions associated with each rule
     * and return the id of the last rule whose conditions evaluate to true
     * @param {string[]} ruleOrder An array of rule IDs indicating what order They
     *                             should be evaluated in
     * @param {Object} rules An object mapping rule IDs to rule configurations
     * @return {string} The ID of the rule to display on the widget
     */
    ConditionManager.prototype.executeRules = function (ruleOrder, rules) {
        var self = this,
            activeId = ruleOrder[0],
            rule,
            conditions;

        ruleOrder.forEach(function (ruleId) {
            rule = rules[ruleId];
            conditions = rule.getProperty('trigger') === 'js' ?
                rule.getProperty('jsCondition') : rule.getProperty('conditions');
            if (self.evaluator.execute(conditions, rule.getProperty('trigger'))) {
                activeId = ruleId;
            }
        });

        return activeId;
    };

    /**
     * Returns the currently tracked telemetry sources
     * @return {Object} An object mapping object keys to domain objects
     */
    ConditionManager.prototype.getComposition = function () {
        return this.compositionObjs;
    };

    /**
     * Get the human-readable name of a domain object from its key
     * @param {string} id The key of the domain object
     * @return {string} The human-readable name of the domain object
     */
    ConditionManager.prototype.getObjectName = function (id) {
        var name;

        if (this.keywordLabels[id]) {
            name = this.keywordLabels[id];
        } else if (this.compositionObjs[id]) {
            name = this.compositionObjs[id].name;
        }

        return name;
    };

    /**
     * Returns the property metadata associated with a given telemetry source
     * @param {string} id The key assoicated with the domain object
     * @return {Object} Returns an object with fields representing each telemetry field
     */
    ConditionManager.prototype.getTelemetryMetadata = function (id) {
        return this.telemetryMetadataById[id];
    };

    /**
     * Returns the type associated with a telemtry data field of a particular domain
     * object
     * @param {string} id The key associated with the domain object
     * @param {string} property The telemetry field key to retrieve the type of
     * @return {string} The type name
     */
    ConditionManager.prototype.getTelemetryPropertyType = function (id, property) {
        if (this.telemetryTypesById[id]) {
            return this.telemetryTypesById[id][property];
        }
    };

    /**
     * Returns the human-readable name of a telemtry data field of a particular domain
     * object
     * @param {string} id The key associated with the domain object
     * @param {string} property The telemetry field key to retrieve the type of
     * @return {string} The telemetry field name
     */
    ConditionManager.prototype.getTelemetryPropertyName = function (id, property) {
        if (this.telemetryMetadataById[id] && this.telemetryMetadataById[id][property]) {
            return this.telemetryMetadataById[id][property].name;
        }
    };

    /**
     * Returns the {ConditionEvaluator} instanace assoicated with this condition
     * manager
     * @return {ConditionEvaluator}
     */
    ConditionManager.prototype.getEvaluator = function () {
        return this.evaluator;
    };

    /**
     * Returns true if the initial compostion load has completed
     * @return {boolean}
     */
    ConditionManager.prototype.loadCompleted = function () {
        return this.loadComplete;
    };

    /**
     * Returns true if the initial block metadata load has completed
     */
    ConditionManager.prototype.metadataLoadCompleted = function () {
        return this.metadataLoadComplete;
    };

    /**
     * Triggers the telemetryRecieve callbacks registered to this ConditionManager,
     * used by the {TestDataManager} to force a rule evaluation when test data is
     * enabled
     */
    ConditionManager.prototype.triggerTelemetryCallback = function () {
        this.eventEmitter.emit('receiveTelemetry');
    };


    /**
     * Unsubscribe from all registered telemetry sources
     */
    ConditionManager.prototype.destroy = function () {
        Object.values(this.subscriptions).forEach(function (unsubscribeFunction) {
            unsubscribeFunction();
        });
    };

    return ConditionManager;
});
