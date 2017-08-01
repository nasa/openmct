define (
    ['lodash'],
    function (_) {

    //provide a centralized content manager for conditions in the summary widget.
    //Load and cache composition and telemetry subscriptions, and handle evaluation
    //of rules
    function SelectManager(domainObject, openmct, evaluator) {
        var self = this;

        this.domainObject = domainObject;
        this.openmct = openmct;
        this.evaluator = evaluator;

        this.composition = this.openmct.composition.get(this.domainObject);

        this.compositionObjs = {};
        this.telemetryMetadataById = {};
        this.telemetryTypesById = {};
        this.loadComplete = false;

        this.callbacks = {
            add: [],
            remove: [],
            load: [],
            metadata: []
        }

        this.composition.on('add', onCompositionAdd, this);
        this.composition.on('remove', onCompositionRemove, this);
        this.composition.on('load', onCompositionLoad, this);

        this.composition.load();

        function onCompositionAdd(obj) {
            var compositionKeys,
                telemetryAPI = this.openmct.telemetry,
                objId = obj.identifier.key,
                telemetryMetadata,
                self = this;

            self.compositionObjs[objId] = obj;
            self.telemetryMetadataById[objId] = {};
            compositionKeys = self.domainObject.composition.map( function (obj) {
                return obj.key;
            })
            if (!compositionKeys.includes(obj.identifier.key)) {
                self.domainObject.composition.push(obj.identifier);
            }

            telemetryMetadata = telemetryAPI.getMetadata(obj).values();
            telemetryMetadata.forEach( function (metaDatum) {
                self.telemetryMetadataById[objId][metaDatum.key] = metaDatum;
            });

            //if this is the initial load, postpose loading metadata so event handlers
            //fire properly
            if (self.loadComplete) {
                getPropertyTypes(obj)
            }

            self.callbacks.add.forEach( function (callback) {
                callback && callback(obj);
            });
        }

        function onCompositionRemove(identifier) {
            _.remove(self.domainObject.composition, function (id) {
                return id.key === identifier.key;
            });
            delete self.compositionObjs[identifier.key];
            self.callbacks.remove.forEach( function (callback) {
                callback && callback(identifier);
            });
        }

        function onCompositionLoad() {
            self.loadComplete = true;
            self.callbacks.load.forEach( function (callback) {
                callback && callback();
            });
            loadMetadata().then( function () {
                self.metadataLoadComplete = true;
                self.callbacks.metadata.forEach( function(callback) {
                    callback && callback();
                })
            })
        }

        function getPropertyTypes(object) {
            var telemetryAPI = self.openmct.telemetry;

            self.telemetryTypesById[object.identifier.key] = {};

            return telemetryAPI.request(object, {}).then( function (telemetry) {
                Object.entries(telemetry[0]).forEach( function(telem) {
                    self.telemetryTypesById[object.identifier.key][telem[0]] = typeof telem[1];
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
                    objs.forEach(function(obj) {
                        getPropertyTypes(obj).then( function () {
                            if (index === objs.length - 1) {
                                resolve();
                            }
                            index += 1;
                        });
                    });
            })
            return promise;
        }
    }

    SelectManager.prototype.on = function (event, callback) {
        if(this.callbacks[event]) {
            this.callbacks[event].push(callback);
        } else {
            throw new Error('Unsupported event type: ' + event);
        }
    }

    SelectManager.prototype.getComposition = function () {
        return this.compositionObjs;
    }

    SelectManager.prototype.getTelemetryMetadata = function (id) {
        return this.telemetryMetadataById[id];
    }

    SelectManager.prototype.getTelemetryPropertyType = function (id, property) {
        if (this.telemetryTypesById[id]) {
            return this.telemetryTypesById[id][property];
        }
    }

    SelectManager.prototype.getEvaluator = function () {
        return this.evaluator;
    }

    SelectManager.prototype.loadCompleted = function () {
        return this.loadComplete;
    }

    SelectManager.prototype.metadataLoadCompleted = function () {
        return this.metadataLoadComplete;
    }
    return SelectManager;
})
