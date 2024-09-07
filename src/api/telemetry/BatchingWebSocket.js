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

/**
 * Provides a reliable and convenient WebSocket abstraction layer that handles
 * a lot of boilerplate common to managing WebSocket connections such as:
 * - Establishing a WebSocket connection to a server
 * - Reconnecting on error, with a fallback strategy
 * - Queuing messages so that clients can send messages without concern for the current
 * connection state of the WebSocket.
 *
 * The WebSocket that it manages is based in a dedicated worker so that network
 * concerns are not handled on the main event loop. This allows for performant receipt
 * and batching of messages without blocking either the UI or server.
 *
 */
// Shim for Internet Explorer, I mean Safari. It doesn't support requestIdleCallback, but it's in a tech preview, so it will be dropping soon.
const requestIdleCallback =
  // eslint-disable-next-line compat/compat
  window.requestIdleCallback ?? ((fn, { timeout }) => setTimeout(fn, timeout));
const ONE_SECOND = 1000;
//const TEN_SECONDS = 10 * ONE_SECOND;

class BatchingWebSocket extends EventTarget {
  #worker;
  #openmct;
  #showingRateLimitNotification;
  #maxBufferSize;
  #applicationIsInitializing;
  #maxBatchWait;
  #firstBatchReceived;
  #lastBatchReceived;
  #peakBufferSize = Number.NEGATIVE_INFINITY;

  constructor(openmct) {
    super();
    // Install worker, register listeners etc.
    const workerFunction = `(${installWorker.toString()})()`;
    const workerBlob = new Blob([workerFunction]);
    const workerUrl = URL.createObjectURL(workerBlob, { type: 'application/javascript' });
    this.#worker = new Worker(workerUrl);
    this.#openmct = openmct;
    this.#showingRateLimitNotification = false;
    this.#maxBufferSize = Number.POSITIVE_INFINITY;
    this.#maxBatchWait = ONE_SECOND;
    this.#applicationIsInitializing = true;
    this.#firstBatchReceived = false;

    const routeMessageToHandler = this.#routeMessageToHandler.bind(this);
    this.#worker.addEventListener('message', routeMessageToHandler);
    openmct.on(
      'destroy',
      () => {
        this.disconnect();
        URL.revokeObjectURL(workerUrl);
      },
      { once: true }
    );

    // openmct.once('start', () => {
    //   setTimeout(() => {
    //     this.#applicationIsInitializing = false;
    //     this.setMaxBufferSize(this.#maxBufferSize);
    //   }, TEN_SECONDS);
    // });
  }

  /**
   * Will establish a WebSocket connection to the provided url
   * @param {string} url The URL to connect to
   */
  connect(url) {
    this.#worker.postMessage({
      type: 'connect',
      url
    });

    this.#readyForNextBatch();
  }

  #readyForNextBatch() {
    this.#worker.postMessage({
      type: 'readyForNextBatch'
    });
  }

  /**
   * Send a message to the WebSocket.
   * @param {any} message The message to send. Can be any type supported by WebSockets.
   * See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send#data
   */
  sendMessage(message) {
    this.#worker.postMessage({
      type: 'message',
      message
    });
  }

  /**
   * @param {number} maxBatchSize the maximum length of a batch of messages. For example,
   * the maximum number of telemetry values to batch before dropping them
   * Note that this is a fail-safe that is only invoked if performance drops to the
   * point where Open MCT cannot keep up with the amount of telemetry it is receiving.
   * In this event it will sacrifice the oldest telemetry in the batch in favor of the
   * most recent telemetry. The user will be informed that telemetry has been dropped.
   *
   * This should be set appropriately for the expected data rate. eg. If telemetry
   * is received at 10Hz for each telemetry point, then a minimal combination of batch
   * size and rate is 10 and 1000 respectively. Ideally you would add some margin, so
   * 15 would probably be a better batch size.
   */
  setMaxBufferSize(maxBatchSize) {
    this.#maxBufferSize = maxBatchSize;
    // if (!this.#applicationIsInitializing) {
    //   this.#sendMaxBufferSizeToWorker(this.#maxBufferSize);
    // }
    this.#sendMaxBufferSizeToWorker(this.#maxBufferSize);
  }
  setMaxBatchWait(wait) {
    this.#maxBatchWait = wait;
    this.#sendBatchWaitToWorker(this.#maxBatchWait);
  }
  #sendMaxBufferSizeToWorker(maxBufferSize) {
    this.#worker.postMessage({
      type: 'setMaxBufferSize',
      maxBufferSize
    });
  }

  #sendBatchWaitToWorker(maxBatchWait) {
    this.#worker.postMessage({
      type: 'setMaxBatchWait',
      maxBatchWait
    });
  }

  /**
   * Disconnect the associated WebSocket. Generally speaking there is no need to call
   * this manually.
   */
  disconnect() {
    this.#worker.postMessage({
      type: 'disconnect'
    });
  }

  #routeMessageToHandler(message) {
    if (message.data.type === 'batch') {
      const batch = message.data.batch;
      const now = performance.now();
      const elapsed = (now - this.#lastBatchReceived) / 1000;
      this.#lastBatchReceived = now;

      let currentBufferLength = message.data.currentBufferLength;
      let maxBufferSize = message.data.maxBufferSize;
      let parameterCount = batch.length;
      if (this.#peakBufferSize < currentBufferLength) {
        this.#peakBufferSize = currentBufferLength;
      }

      if (this.#openmct.performance !== undefined) {
        this.#openmct.performance.measurements.set(
          'Parameters/s',
          Math.floor(parameterCount / elapsed)
        );
        this.#openmct.performance.measurements.set(
          'Buff. Util. (bytes)',
          `${currentBufferLength} / ${maxBufferSize}`
        );
        this.#openmct.performance.measurements.set(
          'Peak Buff. Util. (bytes)',
          `${this.#peakBufferSize} / ${maxBufferSize}`
        );
      }

      this.start = Date.now();
      const dropped = message.data.dropped;
      if (dropped === true && !this.#showingRateLimitNotification) {
        const notification = this.#openmct.notifications.alert(
          'Telemetry dropped due to client rate limiting.',
          { hint: 'Refresh individual telemetry views to retrieve dropped telemetry if needed.' }
        );
        this.#showingRateLimitNotification = true;
        notification.once('minimized', () => {
          this.#showingRateLimitNotification = false;
        });
      }

      this.dispatchEvent(new CustomEvent('batch', { detail: batch }));
      this.#waitUntilIdleAndRequestNextBatch(batch);
    } else if (message.data.type === 'message') {
      this.dispatchEvent(new CustomEvent('message', { detail: message.data.message }));
    } else if (message.data.type === 'reconnected') {
      this.dispatchEvent(new CustomEvent('reconnected'));
    } else {
      throw new Error(`Unknown message type: ${message.data.type}`);
    }
  }

  #waitUntilIdleAndRequestNextBatch(batch) {
    requestIdleCallback(
      (state) => {
        if (this.#firstBatchReceived === false) {
          this.#firstBatchReceived = true;
        }
        const now = Date.now();
        const waitedFor = now - this.start;
        if (state.didTimeout === true) {
          if (document.visibilityState === 'visible') {
            console.warn(`Event loop is too busy to process batch.`);
            this.#waitUntilIdleAndRequestNextBatch(batch);
          } else {
            this.#readyForNextBatch();
          }
        } else {
          if (waitedFor > ONE_SECOND) {
            console.warn(`Warning, batch processing took ${waitedFor}ms`);
          }
          this.#readyForNextBatch();
        }
      },
      { timeout: ONE_SECOND }
    );
  }
}

export default BatchingWebSocket;
