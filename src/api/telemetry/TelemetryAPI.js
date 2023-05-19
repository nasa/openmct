/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import TelemetryCollection from './TelemetryCollection';
import TelemetryRequestInterceptorRegistry from './TelemetryRequestInterceptor';
import CustomStringFormatter from '../../plugins/displayLayout/CustomStringFormatter';
import TelemetryMetadataManager from './TelemetryMetadataManager';
import TelemetryValueFormatter from './TelemetryValueFormatter';
import DefaultMetadataProvider from './DefaultMetadataProvider';
import objectUtils from 'objectUtils';

export default class TelemetryAPI {
  #isGreedyLAD;

  constructor(openmct) {
    this.openmct = openmct;

    this.formatMapCache = new WeakMap();
    this.formatters = new Map();
    this.limitProviders = [];
    this.stalenessProviders = [];
    this.metadataCache = new WeakMap();
    this.metadataProviders = [new DefaultMetadataProvider(this.openmct)];
    this.noRequestProviderForAllObjects = false;
    this.requestAbortControllers = new Set();
    this.requestProviders = [];
    this.subscriptionProviders = [];
    this.valueFormatterCache = new WeakMap();
    this.requestInterceptorRegistry = new TelemetryRequestInterceptorRegistry();
    this.#isGreedyLAD = true;
  }

  abortAllRequests() {
    this.requestAbortControllers.forEach((controller) => controller.abort());
    this.requestAbortControllers.clear();
  }

  /**
   * Return Custom String Formatter
   *
   * @param {Object} valueMetadata valueMetadata for given telemetry object
   * @param {string} format custom formatter string (eg: %.4f, &lts etc.)
   * @returns {CustomStringFormatter}
   */
  customStringFormatter(valueMetadata, format) {
    return new CustomStringFormatter(this.openmct, valueMetadata, format);
  }

  /**
   * Return true if the given domainObject is a telemetry object.  A telemetry
   * object is any object which has telemetry metadata-- regardless of whether
   * the telemetry object has an available telemetry provider.
   *
   * @param {module:openmct.DomainObject} domainObject
   * @returns {boolean} true if the object is a telemetry object.
   */
  isTelemetryObject(domainObject) {
    return Boolean(this.#findMetadataProvider(domainObject));
  }

  /**
   * Check if this provider can supply telemetry data associated with
   * this domain object.
   *
   * @method canProvideTelemetry
   * @param {module:openmct.DomainObject} domainObject the object for
   *        which telemetry would be provided
   * @returns {boolean} true if telemetry can be provided
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   */
  canProvideTelemetry(domainObject) {
    return (
      Boolean(this.findSubscriptionProvider(domainObject)) ||
      Boolean(this.findRequestProvider(domainObject))
    );
  }

  /**
   * Register a telemetry provider with the telemetry service. This
   * allows you to connect alternative telemetry sources.
   * @method addProvider
   * @memberof module:openmct.TelemetryAPI#
   * @param {module:openmct.TelemetryAPI~TelemetryProvider} provider the new
   *        telemetry provider
   */
  addProvider(provider) {
    if (provider.supportsRequest) {
      this.requestProviders.unshift(provider);
    }

    if (provider.supportsSubscribe) {
      this.subscriptionProviders.unshift(provider);
    }

    if (provider.supportsMetadata) {
      this.metadataProviders.unshift(provider);
    }

    if (provider.supportsLimits) {
      this.limitProviders.unshift(provider);
    }

    if (provider.supportsStaleness) {
      this.stalenessProviders.unshift(provider);
    }
  }

  /**
   * Returns a telemetry subscription provider that supports
   * a given domain object and options.
   */
  findSubscriptionProvider() {
    const args = Array.prototype.slice.apply(arguments);
    function supportsDomainObject(provider) {
      return provider.supportsSubscribe.apply(provider, args);
    }

    return this.subscriptionProviders.find(supportsDomainObject);
  }

  /**
   * Returns a telemetry request provider that supports
   * a given domain object and options.
   */
  findRequestProvider() {
    const args = Array.prototype.slice.apply(arguments);
    function supportsDomainObject(provider) {
      return provider.supportsRequest.apply(provider, args);
    }

    return this.requestProviders.find(supportsDomainObject);
  }

  /**
   * @private
   */
  #findMetadataProvider(domainObject) {
    return this.metadataProviders.find((provider) => {
      return provider.supportsMetadata(domainObject);
    });
  }

  /**
   * @private
   */
  #findLimitEvaluator(domainObject) {
    return this.limitProviders.find((provider) => {
      return provider.supportsLimits(domainObject);
    });
  }

  /**
   * @private
   * Though used in TelemetryCollection as well
   */
  standardizeRequestOptions(options) {
    if (!Object.prototype.hasOwnProperty.call(options, 'start')) {
      options.start = this.openmct.time.bounds().start;
    }

    if (!Object.prototype.hasOwnProperty.call(options, 'end')) {
      options.end = this.openmct.time.bounds().end;
    }

    if (!Object.prototype.hasOwnProperty.call(options, 'domain')) {
      options.domain = this.openmct.time.timeSystem().key;
    }

    if (!Object.prototype.hasOwnProperty.call(options, 'timeContext')) {
      options.timeContext = this.openmct.time;
    }
  }

  /**
   * Register a request interceptor that transforms a request via module:openmct.TelemetryAPI.request
   * The request will be modifyed when it is received and will be returned in it's modified state
   * The request will be transformed only if the interceptor is applicable to that domain object as defined by the RequestInterceptorDef
   *
   * @param {module:openmct.RequestInterceptorDef} requestInterceptorDef the request interceptor definition to add
   * @method addRequestInterceptor
   * @memberof module:openmct.TelemetryRequestInterceptorRegistry#
   */
  addRequestInterceptor(requestInterceptorDef) {
    this.requestInterceptorRegistry.addInterceptor(requestInterceptorDef);
  }

  /**
   * Retrieve the request interceptors for a given domain object.
   * @private
   */
  #getInterceptorsForRequest(identifier, request) {
    return this.requestInterceptorRegistry.getInterceptors(identifier, request);
  }

  /**
   * Invoke interceptors if applicable for a given domain object.
   */
  async applyRequestInterceptors(domainObject, request) {
    const interceptors = this.#getInterceptorsForRequest(domainObject.identifier, request);

    if (interceptors.length === 0) {
      return request;
    }

    let modifiedRequest = { ...request };

    for (let interceptor of interceptors) {
      modifiedRequest = await interceptor.invoke(modifiedRequest);
    }

    return modifiedRequest;
  }

  /**
   * Get or set greedy LAD. For stategy "latest" telemetry in
   * realtime mode the start bound will be ignored if true and
   * there is no new data to replace the existing data.
   * defaults to true
   *
   * To turn off greedy LAD:
   * openmct.telemetry.greedyLAD(false);
   *
   * @method greedyLAD
   * @returns {boolean} if greedyLAD is active or not
   * @memberof module:openmct.TelemetryAPI#
   */
  greedyLAD(isGreedy) {
    if (arguments.length > 0) {
      if (isGreedy !== true && isGreedy !== false) {
        throw new Error('Error setting greedyLAD. Greedy LAD only accepts true or false values');
      }

      this.#isGreedyLAD = isGreedy;
    }

    return this.#isGreedyLAD;
  }

  /**
   * Request telemetry collection for a domain object.
   * The `options` argument allows you to specify filters
   * (start, end, etc.), sort order, and strategies for retrieving
   * telemetry (aggregation, latest available, etc.).
   *
   * @method requestCollection
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   * @param {module:openmct.DomainObject} domainObject the object
   *        which has associated telemetry
   * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
   *        options for this telemetry collection request
   * @returns {TelemetryCollection} a TelemetryCollection instance
   */
  requestCollection(domainObject, options = {}) {
    return new TelemetryCollection(this.openmct, domainObject, options);
  }

  /**
   * Request historical telemetry for a domain object.
   * The `options` argument allows you to specify filters
   * (start, end, etc.), sort order, time context, and strategies for retrieving
   * telemetry (aggregation, latest available, etc.).
   *
   * @method request
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   * @param {module:openmct.DomainObject} domainObject the object
   *        which has associated telemetry
   * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
   *        options for this historical request
   * @returns {Promise.<object[]>} a promise for an array of
   *          telemetry data
   */
  async request(domainObject) {
    if (this.noRequestProviderForAllObjects || domainObject.type === 'unknown') {
      return [];
    }

    if (arguments.length === 1) {
      arguments.length = 2;
      arguments[1] = {};
    }

    const abortController = new AbortController();
    arguments[1].signal = abortController.signal;
    this.requestAbortControllers.add(abortController);

    this.standardizeRequestOptions(arguments[1]);

    const provider = this.findRequestProvider.apply(this, arguments);
    if (!provider) {
      this.requestAbortControllers.delete(abortController);

      return this.#handleMissingRequestProvider(domainObject);
    }

    arguments[1] = await this.applyRequestInterceptors(domainObject, arguments[1]);
    try {
      const telemetry = await provider.request(...arguments);

      return telemetry;
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.openmct.notifications.error(
          'Error requesting telemetry data, see console for details'
        );
        console.error(error);
      }

      throw new Error(error);
    } finally {
      this.requestAbortControllers.delete(abortController);
    }
  }

  /**
   * Subscribe to realtime telemetry for a specific domain object.
   * The callback will be called whenever data is received from a
   * realtime provider.
   *
   * @method subscribe
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   * @param {module:openmct.DomainObject} domainObject the object
   *        which has associated telemetry
   * @param {Function} callback the callback to invoke with new data, as
   *        it becomes available
   * @returns {Function} a function which may be called to terminate
   *          the subscription
   */
  subscribe(domainObject, callback, options) {
    if (domainObject.type === 'unknown') {
      return () => {};
    }

    const provider = this.findSubscriptionProvider(domainObject);

    if (!this.subscribeCache) {
      this.subscribeCache = {};
    }

    const keyString = objectUtils.makeKeyString(domainObject.identifier);
    let subscriber = this.subscribeCache[keyString];

    if (!subscriber) {
      subscriber = this.subscribeCache[keyString] = {
        callbacks: [callback]
      };
      if (provider) {
        subscriber.unsubscribe = provider.subscribe(
          domainObject,
          function (value) {
            subscriber.callbacks.forEach(function (cb) {
              cb(value);
            });
          },
          options
        );
      } else {
        subscriber.unsubscribe = function () {};
      }
    } else {
      subscriber.callbacks.push(callback);
    }

    return function unsubscribe() {
      subscriber.callbacks = subscriber.callbacks.filter(function (cb) {
        return cb !== callback;
      });
      if (subscriber.callbacks.length === 0) {
        subscriber.unsubscribe();
        delete this.subscribeCache[keyString];
      }
    }.bind(this);
  }

  /**
   * Subscribe to staleness updates for a specific domain object.
   * The callback will be called whenever staleness changes.
   *
   * @method subscribeToStaleness
   * @memberof module:openmct.TelemetryAPI~StalenessProvider#
   * @param {module:openmct.DomainObject} domainObject the object
   *          to watch for staleness updates
   * @param {Function} callback the callback to invoke with staleness data,
   *  as it is received: ex.
   *  {
   *      isStale: <Boolean>,
   *      timestamp: <timestamp>
   *  }
   * @returns {Function} a function which may be called to terminate
   *          the subscription to staleness updates
   */
  subscribeToStaleness(domainObject, callback) {
    const provider = this.#findStalenessProvider(domainObject);

    if (!this.stalenessSubscriberCache) {
      this.stalenessSubscriberCache = {};
    }

    const keyString = objectUtils.makeKeyString(domainObject.identifier);
    let stalenessSubscriber = this.stalenessSubscriberCache[keyString];

    if (!stalenessSubscriber) {
      stalenessSubscriber = this.stalenessSubscriberCache[keyString] = {
        callbacks: [callback]
      };
      if (provider) {
        stalenessSubscriber.unsubscribe = provider.subscribeToStaleness(
          domainObject,
          (stalenessResponse) => {
            stalenessSubscriber.callbacks.forEach((cb) => {
              cb(stalenessResponse);
            });
          }
        );
      } else {
        stalenessSubscriber.unsubscribe = () => {};
      }
    } else {
      stalenessSubscriber.callbacks.push(callback);
    }

    return function unsubscribe() {
      stalenessSubscriber.callbacks = stalenessSubscriber.callbacks.filter((cb) => {
        return cb !== callback;
      });
      if (stalenessSubscriber.callbacks.length === 0) {
        stalenessSubscriber.unsubscribe();
        delete this.stalenessSubscriberCache[keyString];
      }
    }.bind(this);
  }

  /**
   * Request telemetry staleness for a domain object.
   *
   * @method isStale
   * @memberof module:openmct.TelemetryAPI~StalenessProvider#
   * @param {module:openmct.DomainObject} domainObject the object
   *        which has associated telemetry staleness
   * @returns {Promise.<StalenessResponseObject>} a promise for a StalenessResponseObject
   *        or undefined if no provider exists
   */
  async isStale(domainObject) {
    const provider = this.#findStalenessProvider(domainObject);

    if (!provider) {
      return;
    }

    const abortController = new AbortController();
    const options = { signal: abortController.signal };
    this.requestAbortControllers.add(abortController);

    try {
      const staleness = await provider.isStale(domainObject, options);

      return staleness;
    } finally {
      this.requestAbortControllers.delete(abortController);
    }
  }

  /**
   * @private
   */
  #findStalenessProvider(domainObject) {
    return this.stalenessProviders.find((provider) => {
      return provider.supportsStaleness(domainObject);
    });
  }

  /**
   * Get telemetry metadata for a given domain object.  Returns a telemetry
   * metadata manager which provides methods for interrogating telemetry
   * metadata.
   *
   * @returns {TelemetryMetadataManager}
   */
  getMetadata(domainObject) {
    if (!this.metadataCache.has(domainObject)) {
      const metadataProvider = this.#findMetadataProvider(domainObject);
      if (!metadataProvider) {
        return;
      }

      const metadata = metadataProvider.getMetadata(domainObject);

      this.metadataCache.set(domainObject, new TelemetryMetadataManager(metadata));
    }

    return this.metadataCache.get(domainObject);
  }

  /**
   * Get a value formatter for a given valueMetadata.
   *
   * @returns {TelemetryValueFormatter}
   */
  getValueFormatter(valueMetadata) {
    if (!this.valueFormatterCache.has(valueMetadata)) {
      this.valueFormatterCache.set(
        valueMetadata,
        new TelemetryValueFormatter(valueMetadata, this.formatters)
      );
    }

    return this.valueFormatterCache.get(valueMetadata);
  }

  /**
   * Get a value formatter for a given key.
   * @param {string} key
   *
   * @returns {Format}
   */
  getFormatter(key) {
    return this.formatters.get(key);
  }

  /**
   * Get a format map of all value formatters for a given piece of telemetry
   * metadata.
   *
   * @returns {Object<String, {TelemetryValueFormatter}>}
   */
  getFormatMap(metadata) {
    if (!metadata) {
      return {};
    }

    if (!this.formatMapCache.has(metadata)) {
      const formatMap = metadata.values().reduce(
        function (map, valueMetadata) {
          map[valueMetadata.key] = this.getValueFormatter(valueMetadata);

          return map;
        }.bind(this),
        {}
      );
      this.formatMapCache.set(metadata, formatMap);
    }

    return this.formatMapCache.get(metadata);
  }

  /**
   * Error Handling: Missing Request provider
   *
   * @returns Promise
   */
  #handleMissingRequestProvider(domainObject) {
    this.noRequestProviderForAllObjects = this.requestProviders.every((requestProvider) => {
      const supportsRequest = requestProvider.supportsRequest.apply(requestProvider, arguments);
      const hasRequestProvider =
        Object.prototype.hasOwnProperty.call(requestProvider, 'request') &&
        typeof requestProvider.request === 'function';

      return supportsRequest && hasRequestProvider;
    });

    let message = '';
    let detailMessage = '';
    if (this.noRequestProviderForAllObjects) {
      message = 'Missing request providers, see console for details';
      detailMessage = 'Missing request provider for all request providers';
    } else {
      message = 'Missing request provider, see console for details';
      const { name, identifier } = domainObject;
      detailMessage = `Missing request provider for domainObject, name: ${name}, identifier: ${JSON.stringify(
        identifier
      )}`;
    }

    this.openmct.notifications.error(message);
    console.warn(detailMessage);

    return Promise.resolve([]);
  }

  /**
   * Register a new telemetry data formatter.
   * @param {Format} format the
   */
  addFormat(format) {
    this.formatters.set(format.key, format);
  }

  /**
   * Get a limit evaluator for this domain object.
   * Limit Evaluators help you evaluate limit and alarm status of individual
   * telemetry datums for display purposes without having to interact directly
   * with the Limit API.
   *
   * This method is optional.
   * If a provider does not implement this method, it is presumed
   * that no limits are defined for this domain object's telemetry.
   *
   * @param {module:openmct.DomainObject} domainObject the domain
   *        object for which to evaluate limits
   * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
   * @method limitEvaluator
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   */
  limitEvaluator(domainObject) {
    return this.getLimitEvaluator(domainObject);
  }

  /**
   * Get a limits for this domain object.
   * Limits help you display limits and alarms of
   * telemetry for display purposes without having to interact directly
   * with the Limit API.
   *
   * This method is optional.
   * If a provider does not implement this method, it is presumed
   * that no limits are defined for this domain object's telemetry.
   *
   * @param {module:openmct.DomainObject} domainObject the domain
   *        object for which to get limits
   * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
   * @method limits
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   */
  limitDefinition(domainObject) {
    return this.getLimits(domainObject);
  }

  /**
   * Get a limit evaluator for this domain object.
   * Limit Evaluators help you evaluate limit and alarm status of individual
   * telemetry datums for display purposes without having to interact directly
   * with the Limit API.
   *
   * This method is optional.
   * If a provider does not implement this method, it is presumed
   * that no limits are defined for this domain object's telemetry.
   *
   * @param {module:openmct.DomainObject} domainObject the domain
   *        object for which to evaluate limits
   * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
   * @method limitEvaluator
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   */
  getLimitEvaluator(domainObject) {
    const provider = this.#findLimitEvaluator(domainObject);
    if (!provider) {
      return {
        evaluate: function () {}
      };
    }

    return provider.getLimitEvaluator(domainObject);
  }

  /**
   * Get a limit definitions for this domain object.
   * Limit Definitions help you indicate limits and alarms of
   * telemetry for display purposes without having to interact directly
   * with the Limit API.
   *
   * This method is optional.
   * If a provider does not implement this method, it is presumed
   * that no limits are defined for this domain object's telemetry.
   *
   * @param {module:openmct.DomainObject} domainObject the domain
   *        object for which to display limits
   * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
   * @method limits returns a limits object of
   * type {
   *          level1: {
   *              low: { key1: value1, key2: value2, color: <supportedColor> },
   *              high: { key1: value1, key2: value2, color: <supportedColor> }
   *          },
   *          level2: {
   *              low: { key1: value1, key2: value2 },
   *              high: { key1: value1, key2: value2 }
   *          }
   *       }
   *  supported colors are purple, red, orange, yellow and cyan
   * @memberof module:openmct.TelemetryAPI~TelemetryProvider#
   */
  getLimits(domainObject) {
    const provider = this.#findLimitEvaluator(domainObject);
    if (!provider || !provider.getLimits) {
      return {
        limits: function () {
          return Promise.resolve(undefined);
        }
      };
    }

    return provider.getLimits(domainObject);
  }
}

/**
 * A LimitEvaluator may be used to detect when telemetry values
 * have exceeded nominal conditions.
 *
 * @interface LimitEvaluator
 * @memberof module:openmct.TelemetryAPI~
 */

/**
 * Check for any limit violations associated with a telemetry datum.
 * @method evaluate
 * @param {*} datum the telemetry datum to evaluate
 * @param {TelemetryProperty} the property to check for limit violations
 * @memberof module:openmct.TelemetryAPI~LimitEvaluator
 * @returns {module:openmct.TelemetryAPI~LimitViolation} metadata about
 *          the limit violation, or undefined if a value is within limits
 */

/**
 * A violation of limits defined for a telemetry property.
 * @typedef LimitViolation
 * @memberof {module:openmct.TelemetryAPI~}
 * @property {string} cssClass the class (or space-separated classes) to
 *           apply to display elements for values which violate this limit
 * @property {string} name the human-readable name for the limit violation
 */

/**
 * A TelemetryFormatter converts telemetry values for purposes of
 * display as text.
 *
 * @interface TelemetryFormatter
 * @memberof module:openmct.TelemetryAPI~
 */

/**
 * Retrieve the 'key' from the datum and format it accordingly to
 * telemetry metadata in domain object.
 *
 * @method format
 * @memberof module:openmct.TelemetryAPI~TelemetryFormatter#
 */

/**
 * Describes a property which would be found in a datum of telemetry
 * associated with a particular domain object.
 *
 * @typedef TelemetryProperty
 * @memberof module:openmct.TelemetryAPI~
 * @property {string} key the name of the property in the datum which
 *           contains this telemetry value
 * @property {string} name the human-readable name for this property
 * @property {string} [units] the units associated with this property
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
 * @property {string} sort the key of the property to sort by. This may
 *           be prefixed with a "+" or a "-" sign to sort in ascending
 *           or descending order respectively. If no prefix is present,
 *           ascending order will be used.
 * @property {*} start the lower bound for values of the sorting property
 * @property {*} end the upper bound for values of the sorting property
 * @property {string[]} strategies symbolic identifiers for strategies
 *           (such as `minmax`) which may be recognized by providers;
 *           these will be tried in order until an appropriate provider
 *           is found
 */

/**
 * Provides telemetry data. To connect to new data sources, new
 * TelemetryProvider implementations should be
 * [registered]{@link module:openmct.TelemetryAPI#addProvider}.
 *
 * @interface TelemetryProvider
 * @memberof module:openmct.TelemetryAPI~
 */

/**
 * Provides telemetry staleness data. To subscribe to telemetry stalenes,
 * new StalenessProvider implementations should be
 * [registered]{@link module:openmct.TelemetryAPI#addProvider}.
 *
 * @interface StalenessProvider
 * @property {function} supportsStaleness receieves a domainObject and
 *           returns a boolean to indicate it will provide staleness
 * @property {function} subscribeToStaleness receieves a domainObject to
 *           be subscribed to and a callback to invoke with a StalenessResponseObject
 * @property {function} isStale an asynchronous method called with a domainObject
 *           and an options object which currently has an abort signal, ex.
 *           { signal: <AbortController.signal> }
 *           this method should return a current StalenessResponseObject
 * @memberof module:openmct.TelemetryAPI~
 */

/**
 * @typedef {object} StalenessResponseObject
 * @property {Boolean} isStale boolean representing the staleness state
 * @property {Number} timestamp Unix timestamp in milliseconds
 */

/**
 * An interface for retrieving telemetry data associated with a domain
 * object.
 *
 * @interface TelemetryAPI
 * @augments module:openmct.TelemetryAPI~TelemetryProvider
 * @memberof module:openmct
 */
