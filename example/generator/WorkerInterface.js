/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import { v4 as uuid } from 'uuid';

/**
 * WorkerInterface class manages communication with web workers.
 */
class WorkerInterface {
  /**
   * Creates an instance of WorkerInterface.
   *
   * @param {Object} openmct - The OpenMCT instance.
   * @param {Object} StalenessProvider - The StalenessProvider instance.
   */
  constructor(openmct, StalenessProvider) {
    // eslint-disable-next-line no-undef
    const workerUrl = `${openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}generatorWorker.js`;
    this.StalenessProvider = StalenessProvider;
    this.worker = new Worker(workerUrl);
    this.worker.onmessage = this.onMessage.bind(this);
    this.callbacks = {};
    this.staleTelemetryIds = {};

    this.watchStaleness();
  }

  /**
   * Watches for staleness events and updates the stale telemetry IDs.
   */
  watchStaleness() {
    this.StalenessProvider.on(
      'stalenessEvent',
      function handleStalenessEvent({ id, isStale }) {
        this.staleTelemetryIds[id] = isStale;
      }.bind(this)
    );
  }

  /**
   * Handles messages received from the worker.
   *
   * @param {Object} message - The message received from the worker.
   */
  onMessage(message) {
    message = message.data;
    const callback = this.callbacks[message.id];
    if (callback) {
      callback(message);
    }
  }

  /**
   * Dispatches a message to the worker.
   *
   * @param {string} request - The request type.
   * @param {Object} data - The data to send.
   * @param {Function} [callback] - The callback function.
   * @returns {string} The message ID.
   */
  dispatch(request, data, callback) {
    const message = {
      request: request,
      data: data,
      id: uuid()
    };

    if (callback) {
      this.callbacks[message.id] = callback;
    }

    this.worker.postMessage(message);

    return message.id;
  }

  /**
   * Sends a request to the worker and returns a promise.
   *
   * @param {Object} request - The request object.
   * @returns {Promise} A promise that resolves or rejects based on the worker response.
   */
  request(request) {
    const deferred = {};
    const promise = new Promise(function handlePromise(resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    let messageId;

    const callback = function callback(message) {
      if (message.error) {
        deferred.reject(message.error);
      } else {
        deferred.resolve(message.data);
      }

      delete this.callbacks[messageId];
    }.bind(this);

    messageId = this.dispatch('request', request, callback);

    return promise;
  }

  /**
   * Subscribes to data updates from the worker.
   *
   * @param {Object} request - The subscription request.
   * @param {Function} cb - The callback to handle data updates.
   * @returns {Function} Unsubscribe function.
   */
  subscribe(request, cb) {
    const { id, loadDelay } = request;
    const messageId = this.dispatch(
      'subscribe',
      request,
      function handleSubscription(message) {
        if (!this.staleTelemetryIds[id]) {
          setTimeout(function emitData() {
            cb(message.data);
          }, Math.max(loadDelay, 0));
        }
      }.bind(this)
    );

    return function unsubscribe() {
      this.dispatch('unsubscribe', {
        id: messageId
      });
      delete this.callbacks[messageId];
    }.bind(this);
  }
}

export default WorkerInterface;
