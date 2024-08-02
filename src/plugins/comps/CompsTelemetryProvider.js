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
import CompsManager from './CompsManager.js';

export default class CompsTelemetryProvider {
  #openmct = null;
  #sharedWorker = null;
  #compsManagerPool = null;
  #lastUniqueID = 1;
  #requestPromises = {};
  #subscriptionCallbacks = {};

  constructor(openmct, compsManagerPool) {
    this.#openmct = openmct;
    this.#compsManagerPool = compsManagerPool;
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

  #getCallbackID() {
    return this.#lastUniqueID++;
  }

  // eslint-disable-next-line require-await
  async request(domainObject, options) {
    const specificCompsManager = CompsManager.getCompsManager(
      domainObject,
      this.#openmct,
      this.#compsManagerPool
    );
    await specificCompsManager.load();
    return new Promise((resolve, reject) => {
      const callbackID = this.#getCallbackID();
      const telemetryForComps = specificCompsManager.requestUnderlyingTelemetry();
      const expression = specificCompsManager.getExpression();
      // need to create callbackID with a promise for future execution
      console.debug('🏟️ Telemetry for comps:', telemetryForComps);
      this.#requestPromises[callbackID] = { resolve, reject };
      this.#sharedWorker.port.postMessage({
        type: 'calculateRequest',
        telemetryForComps,
        expression,
        callbackID
      });
    });
  }

  subscribe(domainObject, callback) {
    const specificCompsManager = CompsManager.getCompsManager(
      domainObject,
      this.#openmct,
      this.#compsManagerPool
    );
    const callbackID = this.#getCallbackID();
    this.#subscriptionCallbacks[callbackID] = callback;
    specificCompsManager.on('underlyingTelemetryUpdated', (newTelemetry) => {
      const expression = specificCompsManager.getExpression();
      this.#sharedWorker.port.postMessage({
        type: 'calculateSubscription',
        telemetryForComps: newTelemetry,
        expression,
        callbackID
      });
    });
    return () => {
      specificCompsManager.off('calculationUpdated', callback);
      delete this.#subscriptionCallbacks[callbackID];
    };
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

    this.#openmct.on('destroy', () => {
      this.#sharedWorker.port.close();
    });
  }

  onSharedWorkerMessage(event) {
    console.log('📝 Shared worker message:', event.data);
    const { type, result, callbackID } = event.data;
    if (type === 'calculationSubscriptionResult') {
      this.#subscriptionCallbacks[callbackID](result);
    } else if (type === 'calculationRequestResult') {
      this.#requestPromises[callbackID].resolve(result);
      delete this.#requestPromises[callbackID];
    } else if (type === 'error') {
      console.error('❌ Shared worker error:', event.data);
    }
  }

  onSharedWorkerMessageError(event) {
    console.error('❌ Shared worker message error:', event);
  }
}
