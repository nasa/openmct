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
import uuid from 'uuid'

export default class WorkerInterface {
  constructor (openmct, StalenessProvider) {
    // eslint-disable-next-line no-undef
    const workerUrl = `${openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}generatorWorker.js`;
    this.StalenessProvider = StalenessProvider;
    this.worker = new Worker(workerUrl);
    this.worker.onmessage = this.onMessage.bind(this);
    this.callbacks = {};
    this.staleTelemetryIds = {};

    this.watchStaleness();
  }

  watchStaleness () {
    this.StalenessProvider.on('stalenessEvent', ({ id, isStale }) => {
      this.staleTelemetryIds[id] = isStale;
    });
  }

  onMessage (message) {
    message = message.data;
    const callback = this.callbacks[message.id];
    if (callback) {
      callback(message);
    }
  }

  dispatch (request, data, callback) {
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

  request (request) {
    const deferred = {};
    const promise = new Promise(function (resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    let messageId;

    let self = this;
    function callback(message) {
      if (message.error) {
        deferred.reject(message.error);
      } else {
        deferred.resolve(message.data);
      }

      delete self.callbacks[messageId];
    }

    messageId = this.dispatch('request', request, callback.bind(this));

    return promise;
  }

  subscribe (request, cb) {
    const { id, loadDelay } = request;
    const messageId = this.dispatch('subscribe', request, (message) => {
      if (!this.staleTelemetryIds[id]) {
        setTimeout(() => cb(message.data), Math.max(loadDelay, 0));
      }
    });

    return function () {
      this.dispatch('unsubscribe', {
        id: messageId
      });
      delete this.callbacks[messageId];
    }.bind(this);
  }
}
