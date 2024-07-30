/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

export default class CompsTelemetryProvider {
  #telemetryObjects = {};
  #telemetryCollections = {};
  #composition = [];
  #openmct = null;
  #sharedWorker = null;

  constructor(openmct) {
    this.#openmct = openmct;
    this.#loadComposition();
    this.#startSharedWorker();
  }

  async #loadComposition() {
    this.#composition = this.#openmct.composition.get(this.domainObject);
    if (this.#composition) {
      await this.#composition.load();
      // load all of our telemetry objects
      this.#composition.forEach(this.#addTelemetryObject);

      this.#composition.on('add', this.#addTelemetryObject);
      this.#composition.on('remove', this.#removeTelemetryObject);
    }
  }

  destroy() {
    this.#composition.off('add', this.#addTelemetryObject);
    this.#composition.off('remove', this.removeTelemetryObject);
  }

  #addTelemetryObject(telemetryObject) {
    const keyString = this.#openmct.objects.makeKeyString(telemetryObject.identifier);
    this.#telemetryObjects[keyString] = telemetryObject;
    this.#telemetryCollections[keyString] =
      this.#openmct.telemetry.requestCollection(telemetryObject);

    this.#telemetryCollections[keyString].on('add', this.#telemetryProcessor);
    this.#telemetryCollections[keyString].on('clear', this.#clearData);
    this.#telemetryCollections[keyString].load();
  }

  #telemetryProcessor(telemetryObjects) {
    console.debug('📡 Processing telemetry:', telemetryObjects);
  }

  #clearData() {
    // clear data
    console.debug('🆑 Clearing data');
  }

  #removeTelemetryObject(telemetryObject) {
    const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
    delete this.#telemetryObjects[keyString];
    this.#telemetryCollections[keyString]?.destroy();
    delete this.#telemetryCollections[keyString];
  }

  isTelemetryObject(domainObject) {
    return domainObject.type === 'comps';
  }

  supportsRequest(domainObject) {
    return domainObject.type === 'comps';
  }

  supportsSubscribe(domainObject) {
    return domainObject.type === 'comps';
  }

  // eslint-disable-next-line require-await
  async request(domainObject, options) {
    // get the telemetry from the collections
    const telmetryToSend = {};
    Object.keys(this.#telemetryCollections).forEach((keyString) => {
      telmetryToSend[keyString] = this.#telemetryCollections[keyString].getAll(
        domainObject,
        options
      );
    });
    this.#sharedWorker.port.postMessage({
      type: 'calculate',
      data: telmetryToSend,
      expression: 'a + b'
    });
  }

  subscribe(domainObject, callback) {
    // TODO: add to listener list and return a function to remove it
    return () => {};
  }

  #startSharedWorker() {
    if (this.#sharedWorker) {
      throw new Error('Shared worker already started');
    }
    const sharedWorkerURL = `${this.#openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}compsMathWorker.js`;

    this.#sharedWorker = new SharedWorker(sharedWorkerURL, `Comps Math Worker`);
    this.#sharedWorker.port.onmessage = this.onSharedWorkerMessage.bind(this);
    this.#sharedWorker.port.onmessageerror = this.onSharedWorkerMessageError.bind(this);
    this.#sharedWorker.port.start();

    // send an initial message to the worker
    this.#sharedWorker.port.postMessage({ type: 'init' });

    // for testing, try a message adding two numbers
    this.#sharedWorker.port.postMessage({
      type: 'calculate',
      data: [{ a: 1, b: 2 }],
      expression: 'a + b'
    });

    this.#openmct.on('destroy', () => {
      this.#sharedWorker.port.close();
    });
  }

  onSharedWorkerMessage(event) {
    console.log('📝 Shared worker message:', event.data);
  }

  onSharedWorkerMessageError(event) {
    console.error('❌ Shared worker message error:', event);
  }
}
