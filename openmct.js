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

const matcher = /\/openmct.js$/;
if (document.currentScript) {
  // @ts-ignore
  let src = document.currentScript.src;
  if (src && matcher.test(src)) {
    // @ts-ignore
    __webpack_public_path__ = src.replace(matcher, '') + '/';
  }
}

import { MCT } from './src/MCT.js';

const openmct = new MCT();

export default openmct;

/**
 * @typedef {MCT} OpenMCT
 * @typedef {import('./src/api/objects/ObjectAPI.js').DomainObject} DomainObject
 * @typedef {import('./src/api/objects/ObjectAPI.js').Identifier} Identifier
 * @typedef {import('./src/api/objects/Transaction.js').default} Transaction
 * @typedef {import('./src/api/actions/ActionCollection.js').default} ActionCollection
 * @typedef {import('./src/api/composition/CompositionCollection.js').default} CompositionCollection
 * @typedef {import('./src/api/composition/CompositionProvider.js').default} CompositionProvider
 * @typedef {import('./src/ui/registries/ViewRegistry.js').ViewProvider} ViewProvider
 * @typedef {import('./src/ui/registries/ViewRegistry.js').View} View
 *
 * @typedef {DomainObject[]} ObjectPath
 * @typedef {(...args: any[]) => (openmct: OpenMCT) => void} OpenMCTPlugin
 * An OpenMCT Plugin returns a function that receives an instance of
 * the OpenMCT API and uses it to install itself.
 */

/**
 * @typedef {Object} BuildInfo
 * @property {string} version
 * @property {string} buildDate
 * @property {string} revision
 * @property {string} branch
 */
