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
import CompositionProvider from '../composition/CompositionProvider.js';

export default class RootObjectCompositionProvider extends CompositionProvider {
  #openmct;
  #boundCallbacks = new Set();
  #rootRegistry;

  constructor(openmct, rootRegistry) {
    super(openmct, openmct.composition);
    this.#openmct = openmct;
    this.#rootRegistry = rootRegistry;
  }

  appliesTo(domainObject) {
    return Boolean(domainObject?.identifier?.key === 'ROOT');
  }

  load(domainObject) {
    return this.#rootRegistry.getRoots();
  }

  on(domainObject, event, callback, context) {
    let boundCallbackObject = this.#addListener(event, callback, context);

    this.#rootRegistry.addEventListener(event, boundCallbackObject.callbackWrapper, context);
  }

  off(domainObject, event, callback, context) {
    const boundCallbackObject = this.#removeListener(event, callback, context);

    if (boundCallbackObject !== undefined) {
      this.#rootRegistry.removeEventListener(event, boundCallbackObject.callbackWrapper, context);
    }
  }

  add(domainObject, childId) {
    this.#rootRegistry.addRoot(childId);
  }

  remove(domainObject, childId) {
    this.#rootRegistry.removeRoot(childId);
  }

  includes(domainObject, childId) {
    return this.#rootRegistry.isRootObject(childId);
  }

  #addListener(event, callback, context) {
    let boundCallback = callback;

    if (context !== undefined) {
      boundCallback = callback.bind(context);
    }

    const boundCallbackObject = {
      event,
      callback,
      context,
      boundCallback,
      callbackWrapper: (e) => {
        boundCallback(e.detail);
      }
    };
    this.#boundCallbacks.add(boundCallbackObject);

    return boundCallbackObject;
  }

  #removeListener(event, callback, context) {
    const boundCallbackObject = this.#boundCallbacks.entries().find((o) => {
      return o.event === event && o.callback === callback && o.context === context;
    });

    if (boundCallbackObject !== undefined) {
      this.#boundCallbacks.delete(boundCallbackObject);
    }

    return boundCallbackObject;
  }
}
