define ([
    './ConditionEvaluator',
    'lodash'
], function (
    ConditionEvaluator,
    _
) {

    // provide a centralized content manager for conditions in the summary widget.
    // Load and cache composition and telemetry subscriptions, and handle evaluation
    // of rules
    // parameters:
    // domainObject: the Summary Widget domain object
    // openmct: an MCT instance
    // evaluator: a ConditionEvaluator instance for evaluating conditions
    function ConditionManager(domainObject, openmct) {
        var self = this;

        this.domainObject = domainObject;
        this.openmct = openmct;

        this.composition = this.openmct.composition.get(this.domainObject);
        this.compositionObjs = {};

        this.specialNames = {
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

        this.callbacks = {
            add: [],
            remove: [],
            load: [],
            metadata: [],
            receiveTelemetry: []
        };

        function addGlobalMetadata(metadatum) {
            self.telemetryMetadataById.any[metadatum.key] = metadatum;
            self.telemetryMetadataById.all[metadatum.key] = metadatum;
        }
        function addGlobalPropertyType(key, type) {
            self.telemetryTypesById.any[key] = type;
            self.telemetryTypesById.all[key] = type;
        }

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

        function handleSubscriptionCallback(objId, datum) {
            self.subscriptionCache[objId] = datum;
            self.callbacks.receiveTelemetry.forEach(function (callback) {
                if (callback) {
                    callback();
                }
            });
        }

        function onCompositionAdd(obj) {
            var compositionKeys,
                telemetryAPI = self.openmct.telemetry,
                objId = obj.identifier.key,
                telemetryMetadata;

            if (telemetryAPI.canProvideTelemetry(obj)) {
                self.compositionObjs[objId] = obj;
                self.telemetryMetadataById[objId] = {};

                //workaround to keep composition state current
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

                self.callbacks.add.forEach(function (callback) {
                    if (callback) {
                        callback(obj);
                    }
                });
            }
        }

        function onCompositionRemove(identifier) {
            _.remove(self.domainObject.composition, function (id) {
                return id.key === identifier.key;
            });
            delete self.compositionObjs[identifier.key];
            self.callbacks.remove.forEach(function (callback) {
                if (callback) {
                    callback(identifier);
                }
            });
        }

        function onCompositionLoad() {
            self.loadComplete = true;
            self.callbacks.load.forEach(function (callback) {
                if (callback) {
                    callback();
                }
            });
            loadMetadata().then(function () {
                self.metadataLoadComplete = true;
                self.callbacks.metadata.forEach(function (callback) {
                    if (callback) {
                        callback();
                    }
                });
            });
        }

        this.composition.on('add', onCompositionAdd, this);
        this.composition.on('remove', onCompositionRemove, this);
        this.composition.on('load', onCompositionLoad, this);

        this.composition.load();
    }

    ConditionManager.prototype.on = function (event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        } else {
            throw new Error('Unsupported event type: ' + event);
        }
    };

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

    ConditionManager.prototype.getComposition = function () {
        return this.compositionObjs;
    };

    ConditionManager.prototype.getObjectName = function (id) {
        var name;

        if (this.specialNames[id]) {
            name = this.specialNames[id];
        } else if (this.compositionObjs[id]) {
            name = this.compositionObjs[id].name;
        }

        return name;
    };

    ConditionManager.prototype.getTelemetryMetadata = function (id) {
        return this.telemetryMetadataById[id];
    };

    ConditionManager.prototype.getTelemetryPropertyType = function (id, property) {
        if (this.telemetryTypesById[id]) {
            return this.telemetryTypesById[id][property];
        }
    };

    ConditionManager.prototype.getTelemetryPropertyName = function (id, property) {
        if (this.telemetryMetadataById[id] && this.telemetryMetadataById[id][property]) {
            return this.telemetryMetadataById[id][property].name;
        }
    };

    ConditionManager.prototype.getEvaluator = function () {
        return this.evaluator;
    };

    ConditionManager.prototype.loadCompleted = function () {
        return this.loadComplete;
    };

    ConditionManager.prototype.metadataLoadCompleted = function () {
        return this.metadataLoadComplete;
    };

    ConditionManager.prototype.triggerTelemetryCallback = function () {
        this.callbacks.receiveTelemetry.forEach(function (callback) {
            if (callback) {
                callback();
            }
        });
    };

    return ConditionManager;
});
