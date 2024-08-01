import { EventEmitter } from 'eventemitter3';

export default class CompsManager extends EventEmitter {
  #openmct;
  #domainObject;
  #telemetryObjects = {};
  #telemetryCollections = {};

  constructor(openmct, domainObject) {
    super();
    this.#openmct = openmct;
    this.#domainObject = domainObject;
  }

  #removeTelemetryObject(telemetryObject) {
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    delete this.#telemetryObjects[keyString];
    this.#telemetryCollections[keyString]?.destroy();
    delete this.#telemetryCollections[keyString];
  }

  telemetryProcessor(telemetryObjects) {
    console.debug('Telemetry Processor', telemetryObjects);
  }

  clearData() {
    console.debug('Clear Data');
  }

  #addTelemetryObject(telemetryObject) {
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    this.#telemetryObjects[keyString] = telemetryObject;
    this.#telemetryCollections[keyString] =
      this.#openmct.telemetry.requestCollection(telemetryObject);

    this.#telemetryCollections[keyString].on('add', this.telemetryProcessor);
    this.#telemetryCollections[keyString].on('clear', this.clearData);
    this.#telemetryCollections[keyString].load();
  }

  static getCompsManager(domainObject, openmct, compsManagerPool) {
    const id = openmct.objects.makeKeyString(domainObject.identifier);

    if (!compsManagerPool[id]) {
      compsManagerPool[id] = new CompsManager(domainObject, this.openmct);
    }

    return compsManagerPool[id];
  }
}
