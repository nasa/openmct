import installWorker from './WebSocketWorker.js';

class BatchingWebSocketProvider extends EventTarget {
  #worker;

  constructor() {
    super();
    // Install worker, register listeners etc.
    const workerFunction = `(${installWorker.toString()})()`;
    const workerBlob = new Blob([workerFunction]);
    const workerUrl = URL.createObjectURL(workerBlob, { type: 'application/javascript' });
    this.#worker = new Worker(workerUrl);

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

  setMaxBatchSize(maxBatchLength) {
    this.#worker.postMessage({
      type: 'setMaxBatchSize',
      maxBatchLength
    });
  }

  routeMessageToHandler(message) {
    // Batch message would need to be handle differently here
    if (message.data.type === 'batch') {
      this.dispatchEvent(new CustomEvent('batch', { detail: message.data.batch }));
    } else if (message.data.type === 'message') {
      this.dispatchEvent(new CustomEvent('message', { detail: message.data.message }));
    } else {
      throw new Error(`Unknown message type: ${message.data.type}`);
    }
  }
}

export default BatchingWebSocketProvider;
