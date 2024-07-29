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

export default class ConditionSetTelemetryProvider {
  constructor(openmct) {
    this.openmct = openmct;
    this.#startSharedWorker();
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
    // TODO: do some math in a worker
    return { value: 0 };
  }

  subscribe(domainObject, callback) {
    // TODO: add to listener list and return a function to remove it
    return () => {};
  }

  #startSharedWorker() {
    // eslint-disable-next-line no-undef
    const sharedWorkerURL = `${this.openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}compsMathWorker.js`;

    const sharedWorker = new SharedWorker(sharedWorkerURL, `Comps Math Worker`);
    sharedWorker.port.onmessage = this.onSharedWorkerMessage.bind(this);
    sharedWorker.port.onmessageerror = this.onSharedWorkerMessageError.bind(this);
    sharedWorker.port.start();

    // send an initial message to the worker
    sharedWorker.port.postMessage({ type: 'init' });

    // for testing, try a message adding two numbers
    sharedWorker.port.postMessage({
      type: 'calculate',
      data: [{ a: 1, b: 2 }],
      expression: 'a + b'
    });

    this.openmct.on('destroy', () => {
      sharedWorker.port.close();
    });
  }

  onSharedWorkerMessage(event) {
    console.log('📝 Shared worker message:', event.data);
  }

  onSharedWorkerMessageError(event) {
    console.error('❌ Shared worker message error:', event);
  }
}
