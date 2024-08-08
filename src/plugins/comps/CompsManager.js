import { EventEmitter } from 'eventemitter3';

export default class CompsManager extends EventEmitter {
  #openmct;
  #domainObject;
  #composition;
  #telemetryObjects = {};
  #telemetryCollections = {};
  #managerLoadedPromise;
  #dataFrame = {};

  constructor(openmct, domainObject) {
    super();
    this.#openmct = openmct;
    this.#domainObject = domainObject;

    // Load the composition
    this.#managerLoadedPromise = this.#loadComposition();
  }

  load() {
    return this.#managerLoadedPromise;
  }

  async #loadComposition() {
    this.#composition = this.#openmct.composition.get(this.#domainObject);
    if (this.#composition) {
      this.#composition.on('add', this.#addTelemetryObject);
      this.#composition.on('remove', this.#removeTelemetryObject);
      await this.#composition.load();
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

  #telemetryProcessor = (newTelemetry, keyString) => {
    console.debug(`🎉 new data for ${keyString}!`, newTelemetry);
    this.emit('underlyingTelemetryUpdated', { [keyString]: newTelemetry });
  };

  #clearData() {
    console.debug('Clear Data');
  }

  getExpression() {
    return 'a * b ';
  }

  #addTelemetryObject = async (telemetryObject) => {
    console.debug('📢 CompsManager: #addTelemetryObject', telemetryObject);
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    this.#telemetryObjects[keyString] = telemetryObject;
    this.#telemetryCollections[keyString] =
      this.#openmct.telemetry.requestCollection(telemetryObject);

    this.#telemetryCollections[keyString].on('add', (data) => {
      this.#telemetryProcessor(data, keyString);
    });
    this.#telemetryCollections[keyString].on('clear', this.#clearData);
    await this.#telemetryCollections[keyString].load();
  };

  static getCompsManager(domainObject, openmct, compsManagerPool) {
    const id = openmct.objects.makeKeyString(domainObject.identifier);

    if (!compsManagerPool[id]) {
      compsManagerPool[id] = new CompsManager(openmct, domainObject);
    }

    return compsManagerPool[id];
  }
}
