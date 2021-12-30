/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
        const sortedItems = this._rootItems.sort((a, b) => a.priority - b.priority);
        const promises = sortedItems.map((rootItem) => rootItem.provider());

        return Promise.all(promises);
    }

    // will support older array|function options, as well as new priority argument
    addRoot(rootItem, priority) {

        if (utils.isIdentifier(rootItem)) {
            this._storeRootItem(rootItem, priority || this._openmct.priority.DEFAULT);
        } else if (Array.isArray(rootItem)) {
            rootItem.forEach(item => {
                if (utils.isIdentifier(item)) {
                    this._storeRootItem(item, this._openmct.priority.DEFAULT);
                }
            });
        } else if (typeof rootItem === 'function') {
            rootItem().then(result => {
                // mmm dogfood
                this.addRoot(result);
            });
        }
    }

    _storeRootItem(identifier, priority) {
        this._rootItems.push({
            priority,
            provider: () => {
                return identifier;
            }
        });
    }
}
