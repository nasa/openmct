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
        case 'setRate':
          this.setRate(message);
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
    message(message) {
      const { subscribeMessage } = message.data;
      this.#websocket.enqueueMessage(subscribeMessage);
    }
    setBatchingStrategy(message) {
      const { serializedStrategy } = message.data;
      const batchingStrategy = {
        // eslint-disable-next-line no-new-func
        shouldBatchMessage: new Function(serializedStrategy.shouldBatchMessage),
        // eslint-disable-next-line no-new-func
        getBatchIdFromMessage: new Function(serializedStrategy.getBatchIdFromMessage)
        // Will also include maximum batch length here
      };
      this.#messageBatcher.setBatchingStrategy(batchingStrategy);
    }
    setRate(message) {
      const { rate } = message.data;
      this.#throttledTelemetryEmitter.setRate(rate);
    }
  }

  class WebSocketToWorkerMessageBroker {
    #websocket;
    #worker;
    #messageBatcher;

    constructor(websocket, messageBatcher, worker) {
      this.#websocket = websocket;
      this.#messageBatcher = messageBatcher;
      this.#worker = worker;
    }

    routeMessageToHandler(data) {
      //Implement batching here
      if (this.#messageBatcher.shouldBatchMessage(data)) {
        this.#messageBatcher.addMessageToBatch(data);
      } else {
        this.#worker.postMessage(data);
      }
    }
  }

  class MessageBatcher {
    #batch;
    #batchingStrategy;

    constructor() {
      this.resetBatch();
    }
    resetBatch() {
      this.#batch = {};
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

      if (this.#batch[batchId] === undefined) {
        this.#batch[batchId] = [message];
      } else {
        this.#batch[batchId].push(message);
      }
    }
    nextBatch() {
      const batch = this.#batch;
      this.resetBatch();

      return batch;
    }
  }

  class ThrottledTelemetryEmitter {
    #rate;
    #messageBatcher;
    #worker;
    #intervalHandle;

    constructor(messageBatcher, worker) {
      this.#messageBatcher = messageBatcher;
      this.#worker = worker;
    }

    setRate(rate) {
      this.#rate = rate;
      this.#stop();
      this.#start();
    }

    #start() {
      if (this.#intervalHandle) {
        return;
      }

      this.#intervalHandle = setInterval(() => {
        const batch = this.#messageBatcher.nextBatch();
        this.#worker.postMessage(batch);
      }, this.#rate);
    }

    #stop() {
      if (this.#intervalHandle) {
        clearInterval(this.#intervalHandle);
        this.#intervalHandle = undefined;
      }
    }
  }

  const websocket = new ResilientWebSocket();
  const messageBatcher = new MessageBatcher();
  const workerBroker = new WorkerToWebSocketMessageBroker(websocket, messageBatcher);
  const websocketBroker = new WebSocketToWorkerMessageBroker(websocket, messageBatcher, self);

  self.addEventListener('message', (message) => {
    workerBroker.routeMessageToHandler(message);
  });
  websocket.registerMessageCallback((data) => {
    websocketBroker.routeMessageToHandler(data);
  });
}
