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
    this.#openmct.on('start', this.#startSharedWorker.bind(this));
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

  request(domainObject, options) {
    return new Promise((resolve, reject) => {
      const specificCompsManager = CompsManager.getCompsManager(
        domainObject,
        this.#openmct,
        this.#compsManagerPool
      );
      if (!specificCompsManager.isValid()) {
        resolve([]);
        return;
      }
      specificCompsManager.load().then(() => {
        const callbackID = this.#getCallbackID();
        const telemetryForComps = specificCompsManager.requestUnderlyingTelemetry();
        const expression = specificCompsManager.getExpression();
        const parameters = specificCompsManager.getParameters();
        this.#requestPromises[callbackID] = { resolve, reject };
        const payload = {
          type: 'calculateRequest',
          telemetryForComps,
          expression,
          parameters,
          callbackID
        };
        this.#sharedWorker.port.postMessage(payload);
        console.debug(
          '🧮 Comps Telemetry Provider: sending request request (double request!)',
          payload
        );
      });
    });
  }

  #computeOnNewTelemetry(specificCompsManager, newTelemetry, callbackID) {
    if (!specificCompsManager.isReady()) {
      return;
    }
    const expression = specificCompsManager.getExpression();
    const telemetryForComps = specificCompsManager.getFullDataFrame(newTelemetry);
    const parameters = JSON.parse(JSON.stringify(specificCompsManager.getParameters()));
    const payload = {
      type: 'calculateSubscription',
      telemetryForComps,
      expression,
      parameters,
      callbackID
    };
    console.debug('🧮 Comps Telemetry Provider: sending subscription request', payload);
    this.#sharedWorker.port.postMessage(payload);
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
      this.#computeOnNewTelemetry(specificCompsManager, newTelemetry, callbackID);
    });
    specificCompsManager.startListeningToUnderlyingTelemetry();
    return () => {
      specificCompsManager.off('underlyingTelemetryUpdated', callback);
      delete this.#subscriptionCallbacks[callbackID];
      // if this is the last subscription, tell the comp manager to stop listening
      specificCompsManager.stopListeningToUnderlyingTelemetry();
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

    this.#sharedWorker.port.postMessage({ type: 'init' });

    this.#openmct.on('destroy', () => {
      this.#sharedWorker.port.close();
    });
  }

  onSharedWorkerMessage(event) {
    const { type, result, callbackID, error } = event.data;
    if (
      type === 'calculationSubscriptionResult' &&
      this.#subscriptionCallbacks[callbackID] &&
      result.length
    ) {
      console.debug('📝 Shared worker subscription message:', event.data);
      this.#subscriptionCallbacks[callbackID](result);
    } else if (type === 'calculationRequestResult' && this.#requestPromises[callbackID]) {
      console.debug('📝 Shared worker request message:', event.data);
      if (error) {
        this.#requestPromises[callbackID].reject(error);
      } else {
        this.#requestPromises[callbackID].resolve(result);
      }
      delete this.#requestPromises[callbackID];
    }
  }

  onSharedWorkerMessageError(event) {
    console.error('❌ Shared worker message error:', event);
  }
}
