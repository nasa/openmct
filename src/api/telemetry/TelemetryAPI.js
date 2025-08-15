/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import { makeKeyString } from 'objectUtils';

import CustomStringFormatter from '../../plugins/displayLayout/CustomStringFormatter.js';
import BatchingWebSocket from './BatchingWebSocket.js';
import DefaultMetadataProvider from './DefaultMetadataProvider.js';
import TelemetryCollection from './TelemetryCollection.js';
import TelemetryMetadataManager from './TelemetryMetadataManager.js';
import TelemetryRequestInterceptorRegistry from './TelemetryRequestInterceptor.js';
import TelemetryValueFormatter from './TelemetryValueFormatter.js';

/**
 * @typedef {import('../time/TimeContext').TimeContext} TimeContext
 */

/**
 * Describes and bounds requests for telemetry data.
 *
 * @typedef TelemetryRequestOptions
 * @property {string} [sort] the key of the property to sort by. This may
 *           be prefixed with a "+" or a "-" sign to sort in ascending
 *           or descending order respectively. If no prefix is present,
 *           ascending order will be used.
 * @property {number} [start] the lower bound for values of the sorting property
 * @property {number} [end] the upper bound for values of the sorting property
 * @property {string} [strategy] symbolic identifier for strategies
 *           (such as `latest` or `minmax`) which may be recognized by providers;
 *           these will be tried in order until an appropriate provider
 *           is found
 * @property {AbortController} [signal] an AbortController which can be used
 *           to cancel a telemetry request
 * @property {string} [domain] the domain key of the request
 * @property {TimeContext} [timeContext] the time context to use for this request
 */

/**
 * Describes and bounds requests for telemetry data.
 *
 * @typedef TelemetrySubscriptionOptions
 * @property {string} [strategy] symbolic identifier directing providers on how
 * to handle telemetry subscriptions. The default behavior is 'latest' which will
 * always return a single telemetry value with each callback, and in the event
 * of throttling will always prioritize the latest data, meaning intermediate
 * data will be skipped. Alternatively, the `batch` strategy can be used, which
 * will return all telemetry values since the last callback. This strategy is
 * useful for cases where intermediate data is important, such as when
 * rendering a telemetry plot or table. If `batch` is specified, the subscription
 * callback will be invoked with an Array.
 *
 */

const SUBSCRIBE_STRATEGY = {
  LATEST: 'latest',
  BATCH: 'batch'
};

/**
 * Utilities for telemetry
 * @interface TelemetryAPI
 */
export default class TelemetryAPI {
  #isGreedyLAD;
  #subscribeCache;
  #hasReturnedFirstData;

  get SUBSCRIBE_STRATEGY() {
    return SUBSCRIBE_STRATEGY;
  }

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
    this.BatchingWebSocket = BatchingWebSocket;
    this.#subscribeCache = {};
    this.#hasReturnedFirstData = false;
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
   * @param {import('openmct').DomainObject} domainObject
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
   * @param {import('openmct').DomainObject} domainObject the object for
   *        which telemetry would be provided
   * @returns {boolean} true if telemetry can be provided
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
   * @param {TelemetryRequestOptions} options options for the telemetry request
   * @returns {TelemetryRequestOptions} the options, with defaults filled in
   */
  standardizeRequestOptions(options = {}) {
    if (!Object.hasOwn(options, 'start')) {
      const bounds = options.timeContext?.getBounds();
      if (bounds?.start) {
        options.start = options.timeContext.getBounds().start;
      } else {
        options.start = this.openmct.time.getBounds().start;
      }
    }

    if (!Object.hasOwn(options, 'end')) {
      const bounds = options.timeContext?.getBounds();
      if (bounds?.end) {
        options.end = options.timeContext.getBounds().end;
      } else {
        options.end = this.openmct.time.getBounds().end;
      }
    }

    if (!Object.hasOwn(options, 'domain')) {
      options.domain = this.openmct.time.getTimeSystem().key;
    }

    return options;
  }

  /**
   * Register a request interceptor that transforms a request via module:openmct.TelemetryAPI.request
   * The request will be modified when it is received and will be returned in it's modified state
   * The request will be transformed only if the interceptor is applicable to that domain object as defined by the RequestInterceptorDef
   *
   * @param {module:openmct.RequestInterceptorDef} requestInterceptorDef the request interceptor definition to add
   * @method addRequestInterceptor
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
   * Get or set greedy LAD. For strategy "latest" telemetry in
   * realtime mode the start bound will be ignored if true and
   * there is no new data to replace the existing data.
   * defaults to true
   *
   * To turn off greedy LAD:
   * openmct.telemetry.greedyLAD(false);
   *
   * @method greedyLAD
   * @returns {boolean} if greedyLAD is active or not
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
   * @param {import('openmct').DomainObject} domainObject the object
   *        which has associated telemetry
   * @param {TelemetryRequestOptions} options
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
   * @param {import('openmct').DomainObject} domainObject the object
   *        which has associated telemetry
   * @param {TelemetryRequestOptions} options
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
      if (!this.#hasReturnedFirstData) {
        this.#hasReturnedFirstData = true;
        performance.mark('firstHistoricalDataReturned');
      }
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
   * @param {import('openmct').DomainObject} domainObject the object
   *        which has associated telemetry
   * @param {TelemetrySubscriptionOptions} options configuration items for subscription
   * @param {Function} callback the callback to invoke with new data, as
   *        it becomes available
   * @returns {Function} a function which may be called to terminate
   *          the subscription
   */
  subscribe(domainObject, callback, options = { strategy: SUBSCRIBE_STRATEGY.LATEST }) {
    const requestedStrategy = options.strategy || SUBSCRIBE_STRATEGY.LATEST;

    if (domainObject.type === 'unknown') {
      return () => {};
    }

    const provider = this.findSubscriptionProvider(domainObject, options);
    const supportsBatching =
      Boolean(provider?.supportsBatching) && provider?.supportsBatching(domainObject, options);

    if (!this.#subscribeCache) {
      this.#subscribeCache = {};
    }

    const keyString = makeKeyString(domainObject.identifier);
    const supportedStrategy = supportsBatching ? requestedStrategy : SUBSCRIBE_STRATEGY.LATEST;
    // Override the requested strategy with the strategy supported by the provider
    const optionsWithSupportedStrategy = {
      ...options,
      strategy: supportedStrategy
    };
    // If batching is supported, we need to cache a subscription for each strategy -
    // latest and batched.
    const cacheKey = `${keyString}:${supportedStrategy}`;
    let subscriber = this.#subscribeCache[cacheKey];

    if (!subscriber) {
      subscriber = this.#subscribeCache[cacheKey] = {
        latestCallbacks: [],
        batchCallbacks: []
      };
      if (provider) {
        subscriber.unsubscribe = provider.subscribe(
          domainObject,
          invokeCallbackWithRequestedStrategy,
          optionsWithSupportedStrategy
        );
      } else {
        subscriber.unsubscribe = function () {};
      }
    }

    if (requestedStrategy === SUBSCRIBE_STRATEGY.BATCH) {
      subscriber.batchCallbacks.push(callback);
    } else {
      subscriber.latestCallbacks.push(callback);
    }

    // Guarantees that view receive telemetry in the expected form
    function invokeCallbackWithRequestedStrategy(data) {
      invokeCallbacksWithArray(data, subscriber.batchCallbacks);
      invokeCallbacksWithSingleValue(data, subscriber.latestCallbacks);
    }

    function invokeCallbacksWithArray(data, batchCallbacks) {
      //
      if (data === undefined || data === null || data.length === 0) {
        throw new Error(
          'Attempt to invoke telemetry subscription callback with no telemetry datum'
        );
      }

      if (!Array.isArray(data)) {
        data = [data];
      }

      batchCallbacks.forEach((cb) => {
        cb(data);
      });
    }

    function invokeCallbacksWithSingleValue(data, latestCallbacks) {
      if (Array.isArray(data)) {
        data = data[data.length - 1];
      }

      if (data === undefined || data === null) {
        throw new Error(
          'Attempt to invoke telemetry subscription callback with no telemetry datum'
        );
      }

      latestCallbacks.forEach((cb) => {
        cb(data);
      });
    }

    return function unsubscribe() {
      subscriber.latestCallbacks = subscriber.latestCallbacks.filter(function (cb) {
        return cb !== callback;
      });
      subscriber.batchCallbacks = subscriber.batchCallbacks.filter(function (cb) {
        return cb !== callback;
      });

      if (subscriber.latestCallbacks.length === 0 && subscriber.batchCallbacks.length === 0) {
        subscriber.unsubscribe();
        delete this.#subscribeCache[cacheKey];
      }
    }.bind(this);
  }

  /**
   * Subscribe to staleness updates for a specific domain object.
   * The callback will be called whenever staleness changes.
   *
   * @method subscribeToStaleness
   * @param {import('openmct').DomainObject} domainObject the object
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

    const keyString = makeKeyString(domainObject.identifier);
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
   * Subscribe to run-time changes in configured telemetry limits for a specific domain object.
   * The callback will be called whenever data is received from a
   * limit provider.
   *
   * @method subscribeToLimits
   * @param {import('openmct').DomainObject} domainObject the object
   *        which has associated limits
   * @param {Function} callback the callback to invoke with new data, as
   *        it becomes available
   * @returns {Function} a function which may be called to terminate
   *          the subscription
   */
  subscribeToLimits(domainObject, callback) {
    if (domainObject.type === 'unknown') {
      return () => {};
    }

    const provider = this.#findLimitEvaluator(domainObject);

    if (!this.limitsSubscribeCache) {
      this.limitsSubscribeCache = {};
    }

    const keyString = makeKeyString(domainObject.identifier);
    let subscriber = this.limitsSubscribeCache[keyString];

    if (!subscriber) {
      subscriber = this.limitsSubscribeCache[keyString] = {
        callbacks: [callback]
      };
      if (provider && provider.subscribeToLimits) {
        subscriber.unsubscribe = provider.subscribeToLimits(domainObject, function (value) {
          subscriber.callbacks.forEach(function (cb) {
            cb(value);
          });
        });
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
        delete this.limitsSubscribeCache[keyString];
      }
    }.bind(this);
  }

  /**
   * Request telemetry staleness for a domain object.
   *
   * @method isStale
   * @param {import('openmct').DomainObject} domainObject the object
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
   * @returns {Record<string, TelemetryValueFormatter>}
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
   * @param {import('openmct').DomainObject} domainObject the domain
   *        object for which to evaluate limits
   * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
   * @method limitEvaluator
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
   * @param {import('openmct').DomainObject} domainObject the domain
   *        object for which to get limits
   * @returns {LimitsResponseObject}
   * @method limits
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
   * @param {import('openmct').DomainObject} domainObject the domain
   *        object for which to evaluate limits
   * @returns {module:openmct.TelemetryAPI~LimitEvaluator}
   * @method limitEvaluator
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
   * @param {import('openmct').DomainObject} domainObject the domain
   *        object for which to display limits
   * @returns {LimitsResponseObject}
   * @method limits returns a limits object of type {LimitsResponseObject}
   *  supported colors are purple, red, orange, yellow and cyan
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

    const abortController = new AbortController();
    const options = { signal: abortController.signal };
    this.requestAbortControllers.add(abortController);

    try {
      return provider.getLimits(domainObject, options);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.openmct.notifications.error(
          'Error requesting telemetry data, see console for details'
        );
      }

      throw new Error(error);
    } finally {
      this.requestAbortControllers.delete(abortController);
    }
  }
}

/**
 * A LimitEvaluator may be used to detect when telemetry values
 * have exceeded nominal conditions.
 *
 * @interface LimitEvaluator
 */

/**
 * Check for any limit violations associated with a telemetry datum.
 * @method evaluate
 * @param {*} datum the telemetry datum to evaluate
 * @param {TelemetryProperty} the property to check for limit violations
 * @returns {LimitViolation} metadata about
 *          the limit violation, or undefined if a value is within limits
 */

/**
 * A violation of limits defined for a telemetry property.
 * @typedef LimitViolation
 * @property {string} cssClass the class (or space-separated classes) to
 *           apply to display elements for values which violate this limit
 * @property {string} name the human-readable name for the limit violation
 * @property {number} low a lower limit for violation
 * @property {number} high a higher limit violation
 */

/**
 * @typedef {Object} LimitsResponseObject
 * @property {LimitDefinition} limitLevel the level name and it's limit definition
 * @example {
 *  [limitLevel]: {
 *    low: {
 *      color: lowColor,
 *      value: lowValue
 *    },
 *    high: {
 *      color: highColor,
 *      value: highValue
 *    }
 *  }
 * }
 */

/**
 * Limit defined for a telemetry property.
 * @typedef LimitDefinition
 * @property {LimitDefinitionValue} low a lower limit
 * @property {LimitDefinitionValue} high a higher limit
 */

/**
 * Limit definition for a Limit of a telemetry property.
 * @typedef LimitDefinitionValue
 * @property {string} color color to represent this limit
 * @property {number} value the limit value
 */

/**
 * A TelemetryFormatter converts telemetry values for purposes of
 * display as text.
 *
 * @interface TelemetryFormatter
 */

/**
 * Retrieve the 'key' from the datum and format it accordingly to
 * telemetry metadata in domain object.
 *
 * @method format
 */

/**
 * Describes a property which would be found in a datum of telemetry
 * associated with a particular domain object.
 *
 * @typedef TelemetryProperty
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
 */

/**
 * Provides telemetry staleness data. To subscribe to telemetry staleness,
 * new StalenessProvider implementations should be
 * [registered]{@link module:openmct.TelemetryAPI#addProvider}.
 *
 * @interface StalenessProvider
 * @property {function} supportsStaleness receives a domainObject and
 *           returns a boolean to indicate it will provide staleness
 * @property {function} subscribeToStaleness receives a domainObject to
 *           be subscribed to and a callback to invoke with a StalenessResponseObject
 * @property {function} isStale an asynchronous method called with a domainObject
 *           and an options object which currently has an abort signal, ex.
 *           { signal: <AbortController.signal> }
 *           this method should return a current StalenessResponseObject
 */

/**
 * @typedef {Object} StalenessResponseObject
 * @property {boolean} isStale boolean representing the staleness state
 * @property {number} timestamp Unix timestamp in milliseconds
 */

/**
 * An interface for retrieving telemetry data associated with a domain
 * object.
 *
 * @interface TelemetryAPI
 * @augments module:openmct.TelemetryAPI~TelemetryProvider
 */
