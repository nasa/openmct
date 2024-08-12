import { EventEmitter } from 'eventemitter3';

export default class CompsManager extends EventEmitter {
  #openmct;
  #domainObject;
  #composition;
  #telemetryObjects = {};
  #telemetryCollections = {};
  #dataFrame = {};
  #batchedNewData = {};
  #batchPromises = {};
  #BATCH_DEBOUNCE_MS = 100;
  #telemetryLoadedPromises = [];

  constructor(openmct, domainObject) {
    super();
    this.#openmct = openmct;
    this.#domainObject = domainObject;
  }

  async load() {
    await this.#loadComposition();
    await Promise.all(this.#telemetryLoadedPromises);
    this.#telemetryLoadedPromises = [];
  }

  getTelemetryObjects() {
    return this.#telemetryObjects;
  }

  async #loadComposition() {
    this.#composition = this.#openmct.composition.get(this.#domainObject);
    if (this.#composition) {
      this.#composition.on('add', this.#addTelemetryObject);
      this.#composition.on('remove', this.#removeTelemetryObject);
      await this.#composition.load();
      console.debug('📚 Composition loaded');
    }
  }

  getFullDataFrame(newTelemetry) {
    const dataFrame = {};
    // can assume on data item
    const newTelemetryKey = Object.keys(newTelemetry)[0];
    const newTelemetryData = newTelemetry[newTelemetryKey];
    const otherTelemetryKeys = Object.keys(this.#telemetryCollections).filter(
      (keyString) => keyString !== newTelemetryKey
    );
    // initialize the data frame with the new telemetry data
    dataFrame[newTelemetryKey] = newTelemetryData;
    // initialize the other telemetry data
    otherTelemetryKeys.forEach((keyString) => {
      dataFrame[keyString] = [];
    });

    // march through the new telemetry data and add data to the frame from the other telemetry objects
    // using LOCF

    newTelemetryData.forEach((newDatum) => {
      otherTelemetryKeys.forEach((otherKeyString) => {
        const otherCollection = this.#telemetryCollections[otherKeyString];
        let insertionPointForNewData = otherCollection._sortedIndex(newDatum);
        const otherCollectionData = otherCollection.getAll();
        if (insertionPointForNewData && insertionPointForNewData >= otherCollectionData.length) {
          insertionPointForNewData = otherCollectionData.length - 1;
        }
        // get the closest datum to the new datum
        const closestDatum = otherCollectionData[insertionPointForNewData];
        if (closestDatum) {
          dataFrame[otherKeyString].push(closestDatum);
        }
      });
    });
    return dataFrame;
  }

  #removeTelemetryObject = (telemetryObject) => {
    console.debug('❌ CompsManager: removeTelemetryObject', telemetryObject);
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    delete this.#telemetryObjects[keyString];
    this.#telemetryCollections[keyString]?.destroy();
    delete this.#telemetryCollections[keyString];
  };

  requestUnderlyingTelemetry() {
    const underlyingTelemetry = {};
    Object.keys(this.#telemetryCollections).forEach((collectionKey) => {
      const collection = this.#telemetryCollections[collectionKey];
      underlyingTelemetry[collectionKey] = collection.getAll();
    });
    return underlyingTelemetry;
  }

  #clearBatch(keyString) {
    this.#batchedNewData[keyString] = [];
    this.#batchPromises[keyString] = null;
  }

  #deferredTelemetryProcessor(newTelemetry, keyString) {
    // We until the next event loop cycle to "collect" all of the get
    // requests triggered in this iteration of the event loop

    if (!this.#batchedNewData[keyString]) {
      this.#batchedNewData[keyString] = [];
    }

    this.#batchedNewData[keyString].push(newTelemetry[0]);

    if (!this.#batchPromises[keyString]) {
      this.#batchPromises[keyString] = [];

      this.#batchPromises[keyString] = this.#batchedTelemetryProcessor(
        this.#batchedNewData[keyString],
        keyString
      );
    }
  }

  #batchedTelemetryProcessor = async (newTelemetry, keyString) => {
    await this.#waitForDebounce();

    const specificBatchedNewData = this.#batchedNewData[keyString];

    // clear it
    this.#clearBatch(keyString);
    console.debug(`🎉 new data for ${keyString}!`, specificBatchedNewData);
    this.emit('underlyingTelemetryUpdated', { [keyString]: specificBatchedNewData });
  };

  #clearData() {
    console.debug('Clear Data');
  }

  getExpression() {
    return 'a + b ';
  }

  #waitForDebounce() {
    let timeoutID;
    clearTimeout(timeoutID);

    return new Promise((resolve) => {
      timeoutID = setTimeout(() => {
        resolve();
      }, this.#BATCH_DEBOUNCE_MS);
    });
  }

  #addTelemetryObject = (telemetryObject) => {
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    this.#telemetryObjects[keyString] = telemetryObject;
    this.#telemetryCollections[keyString] =
      this.#openmct.telemetry.requestCollection(telemetryObject);

    this.#telemetryCollections[keyString].on('add', (data) => {
      this.#deferredTelemetryProcessor(data, keyString);
    });
    this.#telemetryCollections[keyString].on('clear', this.#clearData);
    const telemetryLoadedPromise = this.#telemetryCollections[keyString].load();
    this.#telemetryLoadedPromises.push(telemetryLoadedPromise);
    console.debug('📢 CompsManager: loaded telemetry collection', keyString);
  };

  static getCompsManager(domainObject, openmct, compsManagerPool) {
    const id = openmct.objects.makeKeyString(domainObject.identifier);

    if (!compsManagerPool[id]) {
      compsManagerPool[id] = new CompsManager(openmct, domainObject);
    }

    return compsManagerPool[id];
  }
}
