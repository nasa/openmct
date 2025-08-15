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
/* eslint-disable max-classes-per-file */
export default function installWorker() {
  const ONE_SECOND = 1000;
  const FALLBACK_AND_WAIT_MS = [1000, 5000, 5000, 10000, 10000, 30000];

  /**
   * @typedef {import('./BatchingWebSocket').BatchingStrategy} BatchingStrategy
   */

  /**
   * Provides a WebSocket connection that is resilient to errors and dropouts.
   * On an error or dropout, will automatically reconnect.
   *
   * Additionally, messages will be queued and sent only when WebSocket is
   * connected meaning that client code does not need to check the state of
   * the socket before sending.
   */
  class ResilientWebSocket extends EventTarget {
    #webSocket;
    #isConnected = false;
    #isConnecting = false;
    #messageQueue = [];
    #reconnectTimeoutHandle;
    #currentWaitIndex = 0;
    #messageCallbacks = [];
    #wsUrl;
    #reconnecting = false;
    #worker;

    constructor(worker) {
      super();
      this.#worker = worker;
    }

    /**
     * Establish a new WebSocket connection to the given URL
     * @param {string} url
     */
    connect(url) {
      this.#wsUrl = url;
      if (this.#isConnected) {
        throw new Error('WebSocket already connected');
      }

      if (this.#isConnecting) {
        throw new Error('WebSocket connection in progress');
      }

      this.#isConnecting = true;

      this.#webSocket = new WebSocket(url);
      //Exposed to e2e tests so that the websocket can be manipulated during tests. Cannot find any other way to do this.
      // Playwright does not support forcing websocket state changes.
      this.#worker.currentWebSocket = this.#webSocket;

      const boundConnected = this.#connected.bind(this);
      this.#webSocket.addEventListener('open', boundConnected);

      const boundCleanUpAndReconnect = this.#cleanUpAndReconnect.bind(this);
      this.#webSocket.addEventListener('error', boundCleanUpAndReconnect);
      this.#webSocket.addEventListener('close', boundCleanUpAndReconnect);

      const boundMessage = this.#message.bind(this);
      this.#webSocket.addEventListener('message', boundMessage);

      this.addEventListener(
        'disconnected',
        () => {
          this.#webSocket.removeEventListener('open', boundConnected);
          this.#webSocket.removeEventListener('error', boundCleanUpAndReconnect);
          this.#webSocket.removeEventListener('close', boundCleanUpAndReconnect);
        },
        { once: true }
      );
    }

    /**
     * Register a callback to be invoked when a message is received on the WebSocket.
     * This paradigm is used instead of the standard EventTarget or EventEmitter approach
     * for performance reasons.
     * @param {Function} callback The function to be invoked when a message is received
     * @returns an unregister function
     */
    registerMessageCallback(callback) {
      this.#messageCallbacks.push(callback);

      return () => {
        this.#messageCallbacks = this.#messageCallbacks.filter((cb) => cb !== callback);
      };
    }

    #connected() {
      console.info('Websocket connected.');
      this.#isConnected = true;
      this.#isConnecting = false;
      this.#currentWaitIndex = 0;

      if (this.#reconnecting) {
        this.#worker.postMessage({
          type: 'reconnected'
        });
        this.#reconnecting = false;
      }

      this.#flushQueue();
    }

    #cleanUpAndReconnect() {
      console.warn('Websocket closed. Attempting to reconnect...');
      this.disconnect();
      this.#reconnect();
    }

    #message(event) {
      this.#messageCallbacks.forEach((callback) => callback(event.data));
    }

    disconnect() {
      this.#isConnected = false;
      this.#isConnecting = false;

      // On WebSocket error, both error callback and close callback are invoked, resulting in
      // this function being called twice, and websocket being destroyed and deallocated.
      if (this.#webSocket !== undefined && this.#webSocket !== null) {
        this.#webSocket.close();
      }

      this.dispatchEvent(new Event('disconnected'));
      this.#webSocket = undefined;
    }

    #reconnect() {
      if (this.#reconnectTimeoutHandle) {
        return;
      }
      this.#reconnecting = true;

      this.#reconnectTimeoutHandle = setTimeout(() => {
        this.connect(this.#wsUrl);

        this.#reconnectTimeoutHandle = undefined;
      }, FALLBACK_AND_WAIT_MS[this.#currentWaitIndex]);

      if (this.#currentWaitIndex < FALLBACK_AND_WAIT_MS.length - 1) {
        this.#currentWaitIndex++;
      }
    }

    enqueueMessage(message) {
      this.#messageQueue.push(message);
      this.#flushQueueIfReady();
    }

    #flushQueueIfReady() {
      if (this.#isConnected) {
        this.#flushQueue();
      }
    }

    #flushQueue() {
      while (this.#messageQueue.length > 0) {
        if (!this.#isConnected) {
          break;
        }

        const message = this.#messageQueue.shift();
        this.#webSocket.send(message);
      }
    }
  }

  /**
   * Handles messages over the worker interface, and
   * sends corresponding WebSocket messages.
   */
  class WorkerToWebSocketMessageBroker {
    #websocket;
    #messageBatcher;

    constructor(websocket, messageBatcher) {
      this.#websocket = websocket;
      this.#messageBatcher = messageBatcher;
    }

    routeMessageToHandler(message) {
      const { type } = message.data;
      switch (type) {
        case 'connect':
          this.connect(message);
          break;
        case 'disconnect':
          this.disconnect(message);
          break;
        case 'message':
          this.#websocket.enqueueMessage(message.data.message);
          break;
        case 'setBatchingStrategy':
          this.setBatchingStrategy(message);
          break;
        case 'readyForNextBatch':
          this.#messageBatcher.readyForNextBatch();
          break;
        case 'setMaxBatchSize':
          this.#messageBatcher.setMaxBatchSize(message.data.maxBatchSize);
          break;
        case 'setMaxBatchWait':
          this.#messageBatcher.setMaxBatchWait(message.data.maxBatchWait);
          break;
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    }
    connect(message) {
      const { url } = message.data;
      this.#websocket.connect(url);
    }
    disconnect() {
      this.#websocket.disconnect();
    }
    setBatchingStrategy(message) {
      const { serializedStrategy } = message.data;
      const batchingStrategy = {
        // eslint-disable-next-line no-new-func
        shouldBatchMessage: new Function(`return ${serializedStrategy.shouldBatchMessage}`)(),
        // eslint-disable-next-line no-new-func
        getBatchIdFromMessage: new Function(`return ${serializedStrategy.getBatchIdFromMessage}`)()
        // Will also include maximum batch length here
      };
      this.#messageBatcher.setBatchingStrategy(batchingStrategy);
    }
  }

  /**
   * Received messages from the WebSocket, and passes them along to the
   * Worker interface and back to the main thread.
   */
  class WebSocketToWorkerMessageBroker {
    #worker;
    #messageBatcher;

    constructor(messageBatcher, worker) {
      this.#messageBatcher = messageBatcher;
      this.#worker = worker;
    }

    routeMessageToHandler(data) {
      if (this.#messageBatcher.shouldBatchMessage(data)) {
        this.#messageBatcher.addMessageToBatch(data);
      } else {
        this.#worker.postMessage({
          type: 'message',
          message: data
        });
      }
    }
  }

  /**
   * Responsible for batching messages according to the defined batching strategy.
   */
  class MessageBatcher {
    #batch;
    #batchingStrategy;
    #hasBatch = false;
    #maxBatchSize;
    #readyForNextBatch;
    #worker;
    #throttledSendNextBatch;

    constructor(worker) {
      // No dropping telemetry unless we're explicitly told to.
      this.#maxBatchSize = Number.POSITIVE_INFINITY;
      this.#readyForNextBatch = false;
      this.#worker = worker;
      this.#resetBatch();
      this.setMaxBatchWait(ONE_SECOND);
    }
    #resetBatch() {
      this.#batch = {};
      this.#hasBatch = false;
    }
    /**
     * @param {BatchingStrategy} strategy
     */
    setBatchingStrategy(strategy) {
      this.#batchingStrategy = strategy;
    }
    /**
     * Applies the `shouldBatchMessage` function from the supplied batching strategy
     * to each message to determine if it should be added to a batch. If not batched,
     * the message is immediately sent over the worker to the main thread.
     * @param {any} message the message received from the WebSocket. See the WebSocket
     * documentation for more details -
     * https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/data
     * @returns
     */
    shouldBatchMessage(message) {
      return (
        this.#batchingStrategy.shouldBatchMessage &&
        this.#batchingStrategy.shouldBatchMessage(message)
      );
    }
    /**
     * Adds the given message to a batch. The batch group that the message is added
     * to will be determined by the value returned by `getBatchIdFromMessage`.
     * @param {any} message the message received from the WebSocket. See the WebSocket
     * documentation for more details -
     * https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/data
     */
    addMessageToBatch(message) {
      const batchId = this.#batchingStrategy.getBatchIdFromMessage(message);
      let batch = this.#batch[batchId];
      if (batch === undefined) {
        this.#hasBatch = true;
        batch = this.#batch[batchId] = [message];
      } else {
        batch.push(message);
      }
      if (batch.length > this.#maxBatchSize) {
        console.warn(
          `Exceeded max batch size of ${this.#maxBatchSize} for ${batchId}. Dropping value.`
        );
        batch.shift();
        this.#batch.dropped = true;
      }

      if (this.#readyForNextBatch) {
        this.#throttledSendNextBatch();
      }
    }
    setMaxBatchSize(maxBatchSize) {
      this.#maxBatchSize = maxBatchSize;
    }
    setMaxBatchWait(maxBatchWait) {
      this.#throttledSendNextBatch = throttle(this.#sendNextBatch.bind(this), maxBatchWait);
    }
    /**
     * Indicates that client code is ready to receive the next batch of
     * messages. If a batch is available, it will be immediately sent.
     * Otherwise a flag will be set to send the next batch as soon as
     * any new data is available.
     */
    readyForNextBatch() {
      if (this.#hasBatch) {
        this.#throttledSendNextBatch();
      } else {
        this.#readyForNextBatch = true;
      }
    }
    #sendNextBatch() {
      const batch = this.#batch;
      this.#resetBatch();
      this.#worker.postMessage({
        type: 'batch',
        batch
      });
      this.#readyForNextBatch = false;
      this.#hasBatch = false;
    }
  }

  function throttle(callback, wait) {
    let last = 0;
    let throttling = false;

    return function (...args) {
      if (throttling) {
        return;
      }

      const now = performance.now();
      const timeSinceLast = now - last;

      if (timeSinceLast >= wait) {
        last = now;
        callback(...args);
      } else if (!throttling) {
        throttling = true;

        setTimeout(() => {
          last = performance.now();
          throttling = false;
          callback(...args);
        }, wait - timeSinceLast);
      }
    };
  }

  const websocket = new ResilientWebSocket(self);
  const messageBatcher = new MessageBatcher(self);
  const workerBroker = new WorkerToWebSocketMessageBroker(websocket, messageBatcher);
  const websocketBroker = new WebSocketToWorkerMessageBroker(messageBatcher, self);

  self.addEventListener('message', (message) => {
    workerBroker.routeMessageToHandler(message);
  });
  websocket.registerMessageCallback((data) => {
    websocketBroker.routeMessageToHandler(data);
  });

  self.websocketInstance = websocket;
}
