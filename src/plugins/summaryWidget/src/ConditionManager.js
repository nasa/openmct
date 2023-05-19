define(['./ConditionEvaluator', 'objectUtils', 'EventEmitter', 'lodash'], function (
  ConditionEvaluator,
  objectUtils,
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
    this.domainObject = domainObject;
    this.openmct = openmct;

    this.composition = this.openmct.composition.get(this.domainObject);
    this.compositionObjs = {};
    this.eventEmitter = new EventEmitter();
    this.supportedCallbacks = ['add', 'remove', 'load', 'metadata', 'receiveTelemetry'];

    this.keywordLabels = {
      any: 'any Telemetry',
      all: 'all Telemetry'
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

    this.composition.on('add', this.onCompositionAdd, this);
    this.composition.on('remove', this.onCompositionRemove, this);
    this.composition.on('load', this.onCompositionLoad, this);

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
    } else {
      throw (
        event + ' is not a supported callback. Supported callbacks are ' + this.supportedCallbacks
      );
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
    const self = this;
    let activeId = ruleOrder[0];
    let rule;
    let conditions;

    ruleOrder.forEach(function (ruleId) {
      rule = rules[ruleId];
      conditions = rule.getProperty('conditions');
      if (self.evaluator.execute(conditions, rule.getProperty('trigger'))) {
        activeId = ruleId;
      }
    });

    return activeId;
  };

  /**
   * Adds a field to the list of all available metadata fields in the widget
   * @param {Object} metadatum An object representing a set of telemetry metadata
   */
  ConditionManager.prototype.addGlobalMetadata = function (metadatum) {
    this.telemetryMetadataById.any[metadatum.key] = metadatum;
    this.telemetryMetadataById.all[metadatum.key] = metadatum;
  };

  /**
   * Adds a field to the list of properties for globally available metadata
   * @param {string} key The key for the property this type applies to
   * @param {string} type The type that should be associated with this property
   */
  ConditionManager.prototype.addGlobalPropertyType = function (key, type) {
    this.telemetryTypesById.any[key] = type;
    this.telemetryTypesById.all[key] = type;
  };

  /**
   * Given a telemetry-producing domain object, associate each of it's telemetry
   * fields with a type, parsing from historical data.
   * @param {Object} object a domain object that can produce telemetry
   * @return {Promise} A promise that resolves when a telemetry request
   *                   has completed and types have been parsed
   */
  ConditionManager.prototype.parsePropertyTypes = function (object) {
    const objectId = objectUtils.makeKeyString(object.identifier);

    this.telemetryTypesById[objectId] = {};
    Object.values(this.telemetryMetadataById[objectId]).forEach(function (valueMetadata) {
      let type;
      if (valueMetadata.enumerations !== undefined) {
        type = 'enum';
      } else if (Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'range')) {
        type = 'number';
      } else if (Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'domain')) {
        type = 'number';
      } else if (valueMetadata.key === 'name') {
        type = 'string';
      } else {
        type = 'string';
      }

      this.telemetryTypesById[objectId][valueMetadata.key] = type;
      this.addGlobalPropertyType(valueMetadata.key, type);
    }, this);
  };

  /**
   * Parse types of telemetry fields from all composition objects; used internally
   * to perform a block types load once initial composition load has completed
   * @return {Promise} A promise that resolves when all metadata has been loaded
   *                   and property types parsed
   */
  ConditionManager.prototype.parseAllPropertyTypes = function () {
    Object.values(this.compositionObjs).forEach(this.parsePropertyTypes, this);
    this.metadataLoadComplete = true;
    this.eventEmitter.emit('metadata');
  };

  /**
   * Invoked when a telemtry subscription yields new data. Updates the LAD
   * cache and invokes any registered receiveTelemetry callbacks
   * @param {string} objId The key associated with the telemetry source
   * @param {datum} datum The new data from the telemetry source
   * @private
   */
  ConditionManager.prototype.handleSubscriptionCallback = function (objId, telemetryDatum) {
    this.subscriptionCache[objId] = this.createNormalizedDatum(objId, telemetryDatum);
    this.eventEmitter.emit('receiveTelemetry');
  };

  ConditionManager.prototype.createNormalizedDatum = function (objId, telemetryDatum) {
    return Object.values(this.telemetryMetadataById[objId]).reduce((normalizedDatum, metadatum) => {
      normalizedDatum[metadatum.key] = telemetryDatum[metadatum.source];

      return normalizedDatum;
    }, {});
  };

  /**
   * Event handler for an add event in this Summary Widget's composition.
   * Sets up subscription handlers and parses its property types.
   * @param {Object} obj The newly added domain object
   * @private
   */
  ConditionManager.prototype.onCompositionAdd = function (obj) {
    let compositionKeys;
    const telemetryAPI = this.openmct.telemetry;
    const objId = objectUtils.makeKeyString(obj.identifier);
    let telemetryMetadata;
    const self = this;

    if (telemetryAPI.isTelemetryObject(obj)) {
      self.compositionObjs[objId] = obj;
      self.telemetryMetadataById[objId] = {};

      // FIXME: this should just update based on listener.
      compositionKeys = self.domainObject.composition.map(objectUtils.makeKeyString);
      if (!compositionKeys.includes(objId)) {
        self.domainObject.composition.push(obj.identifier);
      }

      telemetryMetadata = telemetryAPI.getMetadata(obj).values();
      telemetryMetadata.forEach(function (metaDatum) {
        self.telemetryMetadataById[objId][metaDatum.key] = metaDatum;
        self.addGlobalMetadata(metaDatum);
      });

      self.subscriptionCache[objId] = {};
      self.subscriptions[objId] = telemetryAPI.subscribe(
        obj,
        function (datum) {
          self.handleSubscriptionCallback(objId, datum);
        },
        {}
      );
      telemetryAPI
        .request(obj, {
          strategy: 'latest',
          size: 1
        })
        .then(function (results) {
          if (results && results.length) {
            self.handleSubscriptionCallback(objId, results[results.length - 1]);
          }
        });

      /**
       * if this is the initial load, parsing property types will be postponed
       * until all composition objects have been loaded
       */
      if (self.loadComplete) {
        self.parsePropertyTypes(obj);
      }

      self.eventEmitter.emit('add', obj);

      const summaryWidget = document.querySelector('.w-summary-widget');
      if (summaryWidget) {
        summaryWidget.classList.remove('s-status-no-data');
      }
    }
  };

  /**
   * Invoked on a remove event in this Summary Widget's compostion. Removes
   * the object from the local composition, and untracks it
   * @param {object} identifier The identifier of the object to be removed
   * @private
   */
  ConditionManager.prototype.onCompositionRemove = function (identifier) {
    const objectId = objectUtils.makeKeyString(identifier);
    // FIXME: this should just update by listener.
    _.remove(this.domainObject.composition, function (id) {
      return id.key === identifier.key && id.namespace === identifier.namespace;
    });
    delete this.compositionObjs[objectId];
    delete this.subscriptionCache[objectId];
    this.subscriptions[objectId](); //unsubscribe from telemetry source
    delete this.subscriptions[objectId];
    this.eventEmitter.emit('remove', identifier);

    if (_.isEmpty(this.compositionObjs)) {
      const summaryWidget = document.querySelector('.w-summary-widget');
      if (summaryWidget) {
        summaryWidget.classList.add('s-status-no-data');
      }
    }
  };

  /**
   * Invoked when the Summary Widget's composition finishes its initial load.
   * Invokes any registered load callbacks, does a block load of all metadata,
   * and then invokes any registered metadata load callbacks.
   * @private
   */
  ConditionManager.prototype.onCompositionLoad = function () {
    this.loadComplete = true;
    this.eventEmitter.emit('load');
    this.parseAllPropertyTypes();
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
    let name;

    if (this.keywordLabels[id]) {
      name = this.keywordLabels[id];
    } else if (this.compositionObjs[id]) {
      name = this.compositionObjs[id].name;
    }

    return name;
  };

  /**
   * Returns the property metadata associated with a given telemetry source
   * @param {string} id The key associated with the domain object
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
   * Returns the {ConditionEvaluator} instance associated with this condition
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
   * Unsubscribe from all registered telemetry sources and unregister all event
   * listeners registered with the Open MCT APIs
   */
  ConditionManager.prototype.destroy = function () {
    Object.values(this.subscriptions).forEach(function (unsubscribeFunction) {
      unsubscribeFunction();
    });
    this.composition.off('add', this.onCompositionAdd, this);
    this.composition.off('remove', this.onCompositionRemove, this);
    this.composition.off('load', this.onCompositionLoad, this);
  };

  return ConditionManager;
});
