/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import utils from './object-utils';

export default class RootRegistry {
  constructor(openmct) {
    this._rootItems = [];
    this._openmct = openmct;
  }

  getRoots() {
    const sortedItems = this._rootItems.sort((a, b) => b.priority - a.priority);
    const promises = sortedItems.map((rootItem) => rootItem.provider());

    return Promise.all(promises).then((rootItems) => rootItems.flat());
  }

  addRoot(rootItem, priority) {
    if (!this._isValid(rootItem)) {
      return;
    }

    this._rootItems.push({
      priority: priority || this._openmct.priority.DEFAULT,
      provider: typeof rootItem === 'function' ? rootItem : () => rootItem
    });
  }

  _isValid(rootItem) {
    if (utils.isIdentifier(rootItem) || typeof rootItem === 'function') {
      return true;
    }

    if (Array.isArray(rootItem)) {
      return rootItem.every(utils.isIdentifier);
    }

    return false;
  }
}
