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
  const FALLBACK_AND_WAIT_MS = [1000, 5000, 5000, 10000, 10000, 30000];

  class ResilientWebSocket extends EventTarget {
    #webSocket;
    #isConnected = false;
    #isConnecting = false;
    #messageQueue = [];
    #reconnectTimeoutHandle;
    #currentWaitIndex = 0;
    #messageCallbacks = [];
    #wsUrl;

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

      const boundConnected = this.#connected.bind(this);
      this.#webSocket.addEventListener('open', boundConnected);

      const boundCleanUpAndReconnect = this.#cleanUpAndReconnect.bind(this);
      this.#webSocket.addEventListener('error', boundCleanUpAndReconnect);

      const boundDisconnect = this.disconnect.bind(this);
      this.#webSocket.addEventListener('close', boundCleanUpAndReconnect);

      const boundMessage = this.#message.bind(this);
      this.#webSocket.addEventListener('message', boundMessage);

      this.addEventListener(
        'disconnected',
        () => {
          this.#webSocket.removeEventListener('open', boundConnected);
          this.#webSocket.removeEventListener('error', boundCleanUpAndReconnect);
          this.#webSocket.removeEventListener('close', boundDisconnect);
        },
        { once: true }
      );
    }

    //Do not use Event dispatching for this. Unnecessary overhead.
    registerMessageCallback(callback) {
      this.#messageCallbacks.push(callback);

      return () => {
        this.#messageCallbacks = this.#messageCallbacks.filter((cb) => cb !== callback);
      };
    }

    #connected() {
      console.debug('Websocket connected.');
      this.#isConnected = true;
      this.#isConnecting = false;
      this.#currentWaitIndex = 0;

      this.dispatchEvent(new Event('connected'));

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

      if (this.#webSocket.readyState === WebSocket.OPEN) {
        this.#webSocket.close();
      }

      this.dispatchEvent(new Event('disconnected'));
      this.#webSocket = undefined;
    }

    #reconnect() {
      if (this.#reconnectTimeoutHandle) {
        return;
      }

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

  class WebSocketToWorkerMessageBroker {
    #worker;
    #messageBatcher;

    constructor(messageBatcher, worker) {
      this.#messageBatcher = messageBatcher;
      this.#worker = worker;
    }

    routeMessageToHandler(data) {
      //Implement batching here
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

  class MessageBatcher {
    #batch;
    #batchingStrategy;
    #hasBatch = false;
    #maxBatchSize;
    #readyForNextBatch;
    #worker;

    constructor(worker) {
      this.#maxBatchSize = 10;
      this.#readyForNextBatch = false;
      this.#worker = worker;
      this.#resetBatch();
    }
    #resetBatch() {
      this.#batch = {};
      this.#hasBatch = false;
    }
    setBatchingStrategy(strategy) {
      this.#batchingStrategy = strategy;
    }
    shouldBatchMessage(message) {
      return (
        this.#batchingStrategy.shouldBatchMessage &&
        this.#batchingStrategy.shouldBatchMessage(message)
      );
    }
    addMessageToBatch(message) {
      const batchId = this.#batchingStrategy.getBatchIdFromMessage(message);
      let batch = this.#batch[batchId];
      if (batch === undefined) {
        batch = this.#batch[batchId] = [message];
      } else {
        batch.push(message);
      }
      if (batch.length > this.#maxBatchSize) {
        batch.shift();
        this.#batch.dropped = this.#batch.dropped || true;
      }
      if (this.#readyForNextBatch) {
        this.#sendNextBatch();
      } else {
        this.#hasBatch = true;
      }
    }
    setMaxBatchSize(maxBatchSize) {
      this.#maxBatchSize = maxBatchSize;
    }
    readyForNextBatch() {
      if (this.#hasBatch) {
        this.#sendNextBatch();
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

  const websocket = new ResilientWebSocket();
  const messageBatcher = new MessageBatcher(self);
  const workerBroker = new WorkerToWebSocketMessageBroker(websocket, messageBatcher);
  const websocketBroker = new WebSocketToWorkerMessageBroker(messageBatcher, self);

  self.addEventListener('message', (message) => {
    workerBroker.routeMessageToHandler(message);
  });
  websocket.registerMessageCallback((data) => {
    websocketBroker.routeMessageToHandler(data);
  });
}
