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
 * Describes the strategy to be used when batching WebSocket messages
 *
 * @typedef BatchingStrategy
 * @property {Function} shouldBatchMessage a function that accepts a single
 * argument - the raw message received from the websocket. Every message
 * received will be evaluated against this function so it should be performant.
 * Note also that this function is executed in a worker, so it must be
 * completely self-contained with no external dependencies. The function
 * should return `true` if the message should be batched, and `false` if not.
 * @property {Function} getBatchIdFromMessage a function that accepts a
 * single argument - the raw message received from the websocket. Only messages
 * where `shouldBatchMessage` has evaluated to true will be passed into this
 * function. The function should return a unique value on which to batch the
 * messages. For example a telemetry, channel, or parameter identifier.
 */
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
 * @memberof module:openmct.telemetry
 */
// Shim for Internet Explorer, I mean Safari. It doesn't support requestIdleCallback, but it's in a tech preview, so it will be dropping soon.
const requestIdleCallback =
  // eslint-disable-next-line compat/compat
  window.requestIdleCallback ?? ((fn, { timeout }) => setTimeout(fn, timeout));
const ONE_SECOND = 1000;
const FIVE_SECONDS = 5 * ONE_SECOND;

class BatchingWebSocket extends EventTarget {
  #worker;
  #openmct;
  #showingRateLimitNotification;
  #maxBatchSize;
  #applicationIsInitializing;
  #maxBatchWait;
  #firstBatchReceived;

  constructor(openmct) {
    super();
    // Install worker, register listeners etc.
    const workerFunction = `(${installWorker.toString()})()`;
    const workerBlob = new Blob([workerFunction]);
    const workerUrl = URL.createObjectURL(workerBlob, { type: 'application/javascript' });
    this.#worker = new Worker(workerUrl);
    this.#openmct = openmct;
    this.#showingRateLimitNotification = false;
    this.#maxBatchSize = Number.POSITIVE_INFINITY;
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

    openmct.once('start', () => {
      // An idle callback is a pretty good indication that a complex display is done loading. At that point set the batch size more conservatively.
      // Force it after 5 seconds if it hasn't happened yet.
      requestIdleCallback(
        () => {
          this.#applicationIsInitializing = false;
          this.setMaxBatchSize(this.#maxBatchSize);
        },
        {
          timeout: FIVE_SECONDS
        }
      );
    });
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
   * Set the strategy used to both decide which raw messages to batch, and how to group
   * them.
   * @param {BatchingStrategy} strategy The batching strategy to use when evaluating
   * raw messages from the WebSocket.
   */
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
  setMaxBatchSize(maxBatchSize) {
    this.#maxBatchSize = maxBatchSize;
    if (!this.#applicationIsInitializing) {
      this.#sendMaxBatchSizeToWorker(this.#maxBatchSize);
    }
  }
  setMaxBatchWait(wait) {
    this.#maxBatchWait = wait;
    this.#sendBatchWaitToWorker(this.#maxBatchWait);
  }
  #sendMaxBatchSizeToWorker(maxBatchSize) {
    this.#worker.postMessage({
      type: 'setMaxBatchSize',
      maxBatchSize
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
      this.start = Date.now();
      const batch = message.data.batch;
      if (batch.dropped === true && !this.#showingRateLimitNotification) {
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
            // After ingesting a telemetry batch, wait until the event loop is idle again before
            // informing the worker we are ready for another batch.
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
