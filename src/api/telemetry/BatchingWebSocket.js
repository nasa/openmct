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
const DEFAULT_RATE_MS = 1000;
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
// IE, I mean _Safari_, doesn't support requestIdleCallback. It's in a tech preview though, so it should be dropping soon.
const requestIdleCallback =
  // eslint-disable-next-line compat/compat
  window.requestIdleCallback ?? ((fn, { timeout }) => setTimeout(fn, timeout));

class BatchingWebSocket extends EventTarget {
  #worker;
  #openmct;
  #showingRateLimitNotification;
  #rate;
  #maxBatchSize;
  #applicationIsInitializing;

  constructor(openmct) {
    super();
    // Install worker, register listeners etc.
    const workerFunction = `(${installWorker.toString()})()`;
    const workerBlob = new Blob([workerFunction]);
    const workerUrl = URL.createObjectURL(workerBlob, { type: 'application/javascript' });
    this.#worker = new Worker(workerUrl);
    this.#openmct = openmct;
    this.#showingRateLimitNotification = false;
    this.#rate = DEFAULT_RATE_MS;
    this.#maxBatchSize = Number.POSITIVE_INFINITY;
    this.#applicationIsInitializing = true;

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
      requestIdleCallback(
        () => {
          this.#applicationIsInitializing = false;
          this.setMaxBatchSize(this.#maxBatchSize);
        },
        {
          timeout: 5000
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
   * When using batching, sets the rate at which batches of messages are released.
   * @param {Number} rate the amount of time to wait, in ms, between batches.
   */
  setRate(rate) {
    this.#rate = rate;
  }

  /**
   * @param {Number} maxBatchSize the maximum length of a batch of messages. For example,
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
  #sendMaxBatchSizeToWorker(maxBatchSize) {
    this.#worker.postMessage({
      type: 'setMaxBatchSize',
      maxBatchSize
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
      performance.mark('batch-received');
      const batch = message.data.batch;
      console.debug(`${Date.now()} received batch ${batch.number} from worker`);
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
    } else {
      throw new Error(`Unknown message type: ${message.data.type}`);
    }
  }

  #waitUntilIdleAndRequestNextBatch(batch) {
    requestIdleCallback(
      (state) => {
        const now = Date.now();
        const waitedFor = now - this.start;
        if (state.didTimeout === true) {
          if (document.visibilityState === 'visible') {
            console.warn(`Event loop is too busy to process batch ${batch.number}.`);
            this.#waitUntilIdleAndRequestNextBatch(batch);
          } else {
            console.debug('Inactive tab, assuming ready for next batch');
            // After ingesting a telemetry batch, wait until the event loop is idle again before
            // informing the worker we are ready for another batch.
            console.debug(
              `${Date.now()} Sending ready signal to worker due to timeout for batch ${
                batch.number
              }`
            );
            performance.mark('batch-processed');
            performance.measure('batch-processing-time', 'batch-received', 'batch-processed');
            this.#readyForNextBatch();
          }
        } else {
          performance.mark('batch-processed');
          performance.measure('batch-processing-time', 'batch-received', 'batch-processed');
          if (waitedFor > 1000) {
            console.warn(`Warning, batch processing took ${waitedFor}ms for batch ${batch.number}`);
          }
          // After ingesting a telemetry batch, wait until the event loop is idle again before
          // informing the worker we are ready for another batch.
          console.debug(
            `${Date.now()} Sending ready signal to worker due to idle event loop for batch ${
              batch.number
            }`
          );
          this.#readyForNextBatch();
        }
      },
      { timeout: 1000 }
    );
  }
}

export default BatchingWebSocket;
