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
    this.getExecutionMonitoring = this.getExecutionMonitoring.bind(this);
    this.subscribeToExecutionMonitoring = this.subscribeToExecutionMonitoring.bind(this);
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
    if (provider.supportsExecutionMonitoring) {
      this.executionMonitoringProviders.unshift(provider);
    }
  }

  /**
   * @private
   */
  #findExecutionMonitoringEvaluator(domainObject) {
    return this.executionMonitoringProviders.find((provider) => {
      return provider.supportsExecutionMonitoring(domainObject);
    });
  }

  /**
   * Get an execution monitoring status source for this domain object.
   * Execution monitoring providers supply a live status (e.g. ahead/behind
   * schedule for a plan) without requiring a user to set it manually.
   *
   * This method is optional. If no provider supports execution monitoring
   * for this domain object, `undefined` is returned so that callers can
   * fall back to their own persistence mechanism.
   *
   * @param {DomainObject} domainObject the domain
   *        object for which to get execution monitoring status
   * @returns {{status: () => Promise<{status: string, duration: number}|undefined>} | undefined}
   * @method getExecutionMonitoring
   */
  getExecutionMonitoring(domainObject) {
    const provider = this.#findExecutionMonitoringEvaluator(domainObject);

    if (!provider || !provider.getExecutionMonitoring) {
      return undefined;
    }

    const abortController = new AbortController();
    const options = { signal: abortController.signal };
    this.requestAbortControllers.add(abortController);

    try {
      return provider.getExecutionMonitoring(domainObject, options);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this._openmct.notifications.error(
          'Error requesting execution monitoring data, see console for details'
        );
      }

      throw new Error(error);
    } finally {
      this.requestAbortControllers.delete(abortController);
    }
  }

  /**
   * Subscribe to run-time changes in execution monitoring status for a
   * specific domain object. The callback will be called whenever new data
   * is received from an execution monitoring provider.
   *
   * @method subscribeToExecutionMonitoring
   * @param {DomainObject} domainObject the object
   *        which has associated execution monitoring status
   * @param {Function} callback the callback to invoke with new data, as
   *        it becomes available
   * @returns {Function} a function which may be called to terminate
   *          the subscription
   */
  subscribeToExecutionMonitoring(domainObject, callback) {
    const provider = this.#findExecutionMonitoringEvaluator(domainObject);

    if (!provider || !provider.subscribeToExecutionMonitoring) {
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
      subscriber.unsubscribe = provider.subscribeToExecutionMonitoring(
        domainObject,
        function (value) {
          subscriber.callbacks.forEach(function (cb) {
            const status = {
              execution_monitoring: {
                [keyString]: value
              }
            };
            cb(status);
          });
        }
      );
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
 * @property {function} supportsExecutionMonitoring receives a domainObject and
 *           returns a boolean to indicate it will provide execution monitoring
 *           status
 * @property {function} getExecutionMonitoring receives a domainObject and an
 *           options object (currently has an abort signal, ex.
 *           { signal: <AbortController.signal> }) and returns an object with
 *           a `status` method, an asynchronous function returning the current
 *           execution monitoring status
 * @property {function} subscribeToExecutionMonitoring receives a domainObject
 *           to be subscribed to and a callback to invoke with new execution
 *           monitoring status as it becomes available
 */
