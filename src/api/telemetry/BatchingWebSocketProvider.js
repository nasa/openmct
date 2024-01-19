/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import installWorker from './WebSocketWorker.js';

class BatchingWebSocketProvider extends EventTarget {
  #worker;
  #openmct;
  #showingRateLimitNotification;

  constructor(openmct) {
    super();
    // Install worker, register listeners etc.
    const workerFunction = `(${installWorker.toString()})()`;
    const workerBlob = new Blob([workerFunction]);
    const workerUrl = URL.createObjectURL(workerBlob, { type: 'application/javascript' });
    this.#worker = new Worker(workerUrl);
    this.#openmct = openmct;
    this.#showingRateLimitNotification = false;

    this.routeMessageToHandler = this.routeMessageToHandler.bind(this);
    this.#worker.addEventListener('message', this.routeMessageToHandler);
  }

  connect(url) {
    this.#worker.postMessage({
      type: 'connect',
      url
    });
  }

  disconnect() {
    this.#worker.postMessage({ type: 'disconnect' });
  }

  sendMessage(message) {
    this.#worker.postMessage({
      type: 'message',
      message
    });
  }

  setBatchingStrategy(strategy) {
    const serializedStrategy = {
      shouldBatchMessage: strategy.shouldBatchMessage.toString(),
      getBatchIdFromMessage: strategy.getBatchIdFromMessage.toString()
    };

    this.#worker.postMessage({
      type: 'setBatchingStrategy',
      serializedStrategy
    });
  }

  setRate(rate) {
    this.#worker.postMessage({
      type: 'setRate',
      rate
    });
  }

  setMaxBatchSize(maxBatchSize) {
    this.#worker.postMessage({
      type: 'setMaxBatchSize',
      maxBatchSize
    });
  }

  routeMessageToHandler(message) {
    // Batch message would need to be handle differently here
    if (message.data.type === 'batch') {
      if (message.data.batch.dropped === true && !this.#showingRateLimitNotification) {
        const notification = this.#openmct.notifications.alert(
          'Telemetry dropped due to client rate limiting.',
          { hint: 'Refresh individual telemetry views to retrieve dropped telemetry if needed.' }
        );
        this.#showingRateLimitNotification = true;
        notification.once('minimized', () => {
          this.#showingRateLimitNotification = false;
        });
        return;
      }
      this.dispatchEvent(new CustomEvent('batch', { detail: message.data.batch }));
    } else if (message.data.type === 'message') {
      this.dispatchEvent(new CustomEvent('message', { detail: message.data.message }));
    } else {
      throw new Error(`Unknown message type: ${message.data.type}`);
    }
  }
}

export default BatchingWebSocketProvider;
