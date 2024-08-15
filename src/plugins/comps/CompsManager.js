import { EventEmitter } from 'eventemitter3';

export default class CompsManager extends EventEmitter {
  #openmct;
  #domainObject;
  #composition;
  #telemetryObjects = {};
  #telemetryCollections = {};
  #dataFrame = {};
  #telemetryLoadedPromises = [];

  constructor(openmct, domainObject) {
    super();
    this.#openmct = openmct;
    this.#domainObject = domainObject;
  }

  addParameter(telemetryObject) {
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    const metaData = this.#openmct.telemetry.getMetadata(telemetryObject);
    const specificTelemetryCollection = this.#telemetryCollections[keyString];
    const specificTimeKey = specificTelemetryCollection.timeKey;
    const timeMetaData = metaData.valueMetadatas.find((metaDatum) => {
      return metaDatum.key === specificTimeKey || metaDatum.source === specificTimeKey;
    });
    const random4Digit = Math.floor(1000 + Math.random() * 9000);
    this.#domainObject.configuration.comps.parameters.push({
      keyString,
      name: `${telemetryObject.name}_${random4Digit}`,
      valueToUse: metaData.valueMetadatas[0].key,
      testValue: 0,
      timeMetaData
    });
    this.persist(this.#domainObject);
  }

  getParameters() {
    const parameters = this.#domainObject.configuration.comps.parameters;
    const parametersWithTimeKey = parameters.map((parameter) => {
      return {
        ...parameter,
        timeKey: this.#telemetryCollections[parameter.keyString]?.timeKey
      };
    });
    return parametersWithTimeKey;
  }

  getTelemetryObjectForParameter(keyString) {
    return this.#telemetryObjects[keyString];
  }

  getMetaDataValuesForParameter(keyString) {
    const telemetryObject = this.getTelemetryObjectForParameter(keyString);
    const metaData = this.#openmct.telemetry.getMetadata(telemetryObject);
    return metaData.valueMetadatas;
  }

  deleteParameter(keyString) {
    this.#domainObject.configuration.comps.parameters =
      this.#domainObject.configuration.comps.parameters.filter(
        (parameter) => parameter.keyString !== keyString
      );
    // if there are no parameters referencing this parameter keyString, remove the telemetry object too
    const parameterExists = this.#domainObject.configuration.comps.parameters.some(
      (parameter) => parameter.keyString === keyString
    );
    if (!parameterExists) {
      this.#composition.remove(this.#telemetryObjects[keyString]);
    }
    this.persist();
  }

  persist(passedDomainObject) {
    this.#openmct.objects.mutate(
      this.#domainObject,
      'configuration.comps',
      passedDomainObject.configuration.comps
    );
    console.debug(
      `📦 CompsManager: persisted domain object`,
      passedDomainObject.configuration.comps
    );
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

  #removeTelemetryObject = (telemetryObjectIdentifier) => {
    console.debug('❌ CompsManager: removeTelemetryObject', telemetryObjectIdentifier);
    const keyString = this.#openmct.objects.makeKeyString(telemetryObjectIdentifier);
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
    this.emit('underlyingTelemetryUpdated', { [keyString]: newTelemetry });
  };

  #clearData() {
    console.debug('Clear Data');
  }

  getExpression() {
    return this.#domainObject.configuration.comps.expression;
  }

  #addTelemetryObject = (telemetryObject) => {
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    this.#telemetryObjects[keyString] = telemetryObject;
    this.#telemetryCollections[keyString] =
      this.#openmct.telemetry.requestCollection(telemetryObject);

    this.#telemetryCollections[keyString].on('add', (data) => {
      this.#telemetryProcessor(data, keyString);
    });
    this.#telemetryCollections[keyString].on('clear', this.#clearData);
    const telemetryLoadedPromise = this.#telemetryCollections[keyString].load();
    this.#telemetryLoadedPromises.push(telemetryLoadedPromise);
    console.debug('📢 CompsManager: loaded telemetry collection', keyString);

    // check to see if we have a corresponding parameter
    // if not, add one
    const parameterExists = this.#domainObject.configuration.comps.parameters.some(
      (parameter) => parameter.keyString === keyString
    );
    if (!parameterExists) {
      this.addParameter(telemetryObject);
    }
  };

  static getCompsManager(domainObject, openmct, compsManagerPool) {
    const id = openmct.objects.makeKeyString(domainObject.identifier);

    if (!compsManagerPool[id]) {
      compsManagerPool[id] = new CompsManager(openmct, domainObject);
    }

    return compsManagerPool[id];
  }
}
