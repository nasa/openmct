/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { makeKeyString } from 'objectUtils';

/**
 * @typedef {import('openmct').OpenMCT} OpenMCT
 * @typedef {import('openmct').DomainObject} DomainObject
 */

/**
 * An interface for planning-related concerns, such as execution monitoring
 * status for a plan. To connect a source of execution monitoring status,
 * new PlanProvider implementations should be
 * [registered]{@link module:openmct.PlanAPI#addProvider}.
 */
export default class PlanAPI {
  /**
   * Constructs a new instance of the PlanAPI class.
   * @param {OpenMCT} openmct - The Open MCT application instance.
   */
  constructor(openmct) {
    this._openmct = openmct;

    this.executionMonitoringProviders = [];
    this.requestAbortControllers = new Set();

    this.addProvider = this.addProvider.bind(this);
    this.getExecutionStatus = this.getExecutionStatus.bind(this);
    this.hasExecutionStatusProvider = this.hasExecutionStatusProvider.bind(this);
    this.subscribeForExecutionStatus = this.subscribeForExecutionStatus.bind(this);
  }

  abortAllRequests() {
    this.requestAbortControllers.forEach((controller) => controller.abort());
    this.requestAbortControllers.clear();
  }

  /**
   * Register a plan provider with the plan API. This allows you to connect
   * alternative sources of planning-related data, such as execution
   * monitoring status.
   * @method addProvider
   * @param {module:openmct.PlanAPI~PlanProvider} provider the new plan provider
   */
  addProvider(provider) {
    if (provider.supportsExecutionStatus) {
      this.executionMonitoringProviders.unshift(provider);
    }
  }

  /**
   * @private
   */
  #findExecutionStatusEvaluator(domainObject) {
    return this.executionMonitoringProviders.find((provider) => {
      return provider.supportsExecutionStatus(domainObject);
    });
  }

  /**
   * Determine whether any registered provider supplies execution monitoring
   * status for this domain object. Callers should use this to decide
   * whether to use {@link module:openmct.PlanAPI#getExecutionStatus} or
   * fall back to their own persistence mechanism.
   *
   * @param {DomainObject} domainObject the domain
   *        object for which to check for an execution status provider
   * @returns {boolean} true if a provider supports execution status for
   *          this domain object
   * @method hasExecutionStatusProvider
   */
  hasExecutionStatusProvider(domainObject) {
    return Boolean(this.#findExecutionStatusEvaluator(domainObject));
  }

  /**
   * Get an execution monitoring status source for this domain object.
   * Execution monitoring providers supply a live status (e.g. ahead/behind
   * schedule for a plan) without requiring a user to set it manually.
   *
   * Callers should first check {@link module:openmct.PlanAPI#hasExecutionStatusProvider}
   * to determine whether a provider is registered for this domain object.
   *
   * @param {DomainObject} domainObject the domain
   *        object for which to get execution status
   * @returns {Promise<{status: string, duration: number}|undefined>}
   * @method getExecutionStatus
   */
  async getExecutionStatus(domainObject) {
    const provider = this.#findExecutionStatusEvaluator(domainObject);

    if (!provider || !provider.getExecutionStatus) {
      return undefined;
    }

    const abortController = new AbortController();
    const options = { signal: abortController.signal };
    this.requestAbortControllers.add(abortController);

    try {
      return await provider.getExecutionStatus(domainObject, options);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this._openmct.notifications.error(
          'Error requesting execution monitoring data, see console for details'
        );
      }

      throw error;
    } finally {
      this.requestAbortControllers.delete(abortController);
    }
  }

  /**
   * Subscribe to run-time changes in execution status for a
   * specific domain object. The callback will be called whenever new data
   * is received from an execution monitoring provider.
   *
   * @method subscribeForExecutionStatus
   * @param {DomainObject} domainObject the object
   *        which has associated execution monitoring status
   * @param {Function} callback the callback to invoke with new data, as
   *        it becomes available
   * @returns {Function} a function which may be called to terminate
   *          the subscription
   */
  subscribeForExecutionStatus(domainObject, callback) {
    const provider = this.#findExecutionStatusEvaluator(domainObject);

    if (!provider || !provider.subscribeForExecutionStatus) {
      return () => {};
    }

    if (!this.executionMonitoringSubscribeCache) {
      this.executionMonitoringSubscribeCache = {};
    }

    const keyString = makeKeyString(domainObject.identifier);
    let subscriber = this.executionMonitoringSubscribeCache[keyString];

    if (!subscriber) {
      subscriber = this.executionMonitoringSubscribeCache[keyString] = {
        callbacks: [callback]
      };
      subscriber.unsubscribe = provider.subscribeForExecutionStatus(domainObject, function (value) {
        subscriber.callbacks.forEach(function (cb) {
          cb(value);
        });
      });
    } else {
      subscriber.callbacks.push(callback);
    }

    return function unsubscribe() {
      subscriber.callbacks = subscriber.callbacks.filter(function (cb) {
        return cb !== callback;
      });
      if (subscriber.callbacks.length === 0) {
        subscriber.unsubscribe();
        delete this.executionMonitoringSubscribeCache[keyString];
      }
    }.bind(this);
  }
}

/**
 * Provides execution monitoring status for a domain object. To subscribe to
 * execution monitoring, new PlanProvider implementations should be
 * [registered]{@link module:openmct.PlanAPI#addProvider}.
 *
 * @interface PlanProvider
 * @property {function} supportsExecutionStatus receives a domainObject and
 *           returns a boolean to indicate it will provide execution monitoring
 *           status
 * @property {function} getExecutionStatus receives a domainObject and an
 *           options object (currently has an abort signal, ex.
 *           { signal: <AbortController.signal> }) and returns a Promise
 *           resolving to the current execution monitoring status
 * @property {function} subscribeForExecutionStatus receives a domainObject
 *           to be subscribed to and a callback to invoke with new execution
 *           monitoring status as it becomes available
 */
