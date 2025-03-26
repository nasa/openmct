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
 * @typedef RequestIdleCallbackOptions
 * @prop {Number} timeout If the number of milliseconds represented by this
 * parameter has elapsed and the callback has not already been called, invoke
 *  the callback.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 */

/**
 * Mocks requestIdleCallback for Safari using setTimeout. Functionality will be
 * identical to setTimeout in Safari, which is to fire the callback function
 * after the provided timeout period.
 *
 * In browsers that support requestIdleCallback, this const is just a
 * pointer to the native function.
 *
 * @param {Function} callback a callback to be invoked during the next idle period, or
 * after the specified timeout
 * @param {RequestIdleCallbackOptions} options
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 *
 */
function requestIdleCallbackPolyfill(callback, options) {
  return (
    // eslint-disable-next-line compat/compat
    window.requestIdleCallback ??
    ((fn, { timeout }) =>
      setTimeout(() => {
        fn({ didTimeout: false });
      }, timeout))
  );
}
const requestIdleCallback = requestIdleCallbackPolyfill();

const ONE_SECOND = 1000;

/**
 * Provides a WebSocket abstraction layer that handles a lot of boilerplate common
 * to managing WebSocket connections such as:
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
class BatchingWebSocket extends EventTarget {
  #worker;
  #openmct;
  #showingRateLimitNotification;
  #maxBufferSize;
  #throttleRate;
  #firstBatchReceived;
  #lastBatchReceived;
  #peakBufferSize = Number.NEGATIVE_INFINITY;

  /**
   * @param {import('openmct.js').OpenMCT} openmct
   */
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
    this.#throttleRate = ONE_SECOND;
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
   * @param {number} maxBufferSize the maximum length of the receive buffer in characters.
   * Note that this is a fail-safe that is only invoked if performance drops to the
   * point where Open MCT cannot keep up with the amount of telemetry it is receiving.
   * In this event it will sacrifice the oldest telemetry in the batch in favor of the
   * most recent telemetry. The user will be informed that telemetry has been dropped.
   *
   * This should be set appropriately for the expected data rate. eg. If typical usage
   * sees 2000 messages arriving at a client per second, with an average message size
   * of 500 bytes, then 2000 * 500 = 1000000 characters will be right on the limit.
   * In this scenario, a buffer size of 1500000 character might be more appropriate
   * to allow some overhead for bursty telemetry, and temporary UI load during page
   * load.
   *
   * The PerformanceIndicator plugin (openmct.plugins.PerformanceIndicator) gives
   * statistics on buffer utilization. It can be used to scale the buffer appropriately.
   */
  setMaxBufferSize(maxBatchSize) {
    this.#maxBufferSize = maxBatchSize;
    this.#sendMaxBufferSizeToWorker(this.#maxBufferSize);
  }
  setThrottleRate(throttleRate) {
    this.#throttleRate = throttleRate;
    this.#sendThrottleRateToWorker(this.#throttleRate);
  }
  setThrottleMessagePattern(throttleMessagePattern) {
    this.#worker.postMessage({
      type: 'setThrottleMessagePattern',
      throttleMessagePattern
    });
  }

  #sendMaxBufferSizeToWorker(maxBufferSize) {
    this.#worker.postMessage({
      type: 'setMaxBufferSize',
      maxBufferSize
    });
  }

  #sendThrottleRateToWorker(throttleRate) {
    this.#worker.postMessage({
      type: 'setThrottleRate',
      throttleRate
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

      let currentBufferLength = message.data.currentBufferLength;
      let maxBufferSize = message.data.maxBufferSize;
      let parameterCount = batch.length;
      if (this.#peakBufferSize < currentBufferLength) {
        this.#peakBufferSize = currentBufferLength;
      }

      if (this.#openmct.performance !== undefined) {
        if (!isNaN(this.#lastBatchReceived)) {
          const elapsed = (now - this.#lastBatchReceived) / 1000;
          this.#lastBatchReceived = now;
          this.#openmct.performance.measurements.set(
            'Parameters/s',
            Math.floor(parameterCount / elapsed)
          );
        }
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
          if (waitedFor > this.#throttleRate) {
            console.warn(`Warning, batch processing took ${waitedFor}ms`);
          }
          this.#readyForNextBatch();
        }
      },
      { timeout: this.#throttleRate }
    );
  }
}

export default BatchingWebSocket;
