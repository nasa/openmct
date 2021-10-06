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

export default class Transaction {
    constructor(objectAPI) {
        this.dirtyObjects = new Set();
        this.objectAPI = objectAPI;
    }

    add(object) {
        this.dirtyObjects.add(object);
    }

    cancel() {
        return this._clear();
    }

    commit() {
        const promiseArray = [];
        this.dirtyObjects.forEach(object => {
            promiseArray.push(this.objectAPI.save(object));
        });

        // TODO: clear only when all promises are resolved
        //      else remove objects for resolved promises and keep unresolved dirtyObjects
        //      notify user and keep edit mode on.
        this._clear();

        return Promise.all(promiseArray);
    }

    start() {
        this.dirtyObjects = new Set();
    }

    _clear() {
        this.dirtyObjects = new Set();
        const domainPbject = this.objectAPI.refresh();

        return Promise.resolve(domainPbject);
    }
}
