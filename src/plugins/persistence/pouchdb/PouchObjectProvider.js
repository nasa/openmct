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

import PouchDocument from './PouchDocument';
import PouchDB from 'pouchdb';

const ID = "_id";

export default class PouchObjectProvider {
    constructor(openmct, options = {name: 'openmct', remoteCouch: 'http://127.0.0.1:5984/openmct'}, namespace = ''){
        this._openmct = openmct;
        this._options = options;
        this._namespace = namespace;
        this._remoteCouch = options.remoteCouch;
        this._rev = {};

        this.pouchDB = new PouchDB(this._options.name);

        let opts = {live: true};
        this.pouchDB.changes({
            since: 'now',
            live: true
          }).on('change', this._updatedObjects.bind(this));
        this.pouchDB.replicate.to(this._remoteCouch, opts, this._logError);
        this.pouchDB.replicate.from(this._remoteCouch, opts, this._logError);

        this.pouchDB.get('mine').then(this._getModel.bind(this), this._initializeMyItems.bind(this));
    }

    _initializeMyItems() {
        let identifier = {
            namespace: this._namespace,
            key: 'mine'
        };
        let myItemModel = {
            identifier,
            "name": "My Items",
            "type": "folder",
            "composition": [],
            "location": "ROOT"
        };

        this.create(myItemModel);
    }

    _updatedObjects(updated) {
        let identifier = {
            namespace: this._namespace,
            key: updated.id
        };

        this._openmct.objects.getMutable(identifier).then(mutable => {
            this.get(identifier).then(this._refreshObjects.bind(this, mutable), this._logError);
        });
    }

    _refreshObjects(mutable, response) {
        mutable.$refresh(response);
    }

    get(identifier, abortSignal) {
        return this.pouchDB.get(identifier.key).then(this._getModel.bind(this), this._logError.bind(this));
    }

    _getModel(response) {
        if (response && response.model) {
            let key = response[ID];
            let object = response.model;
            object.identifier = {
                namespace: this.namespace,
                key: key
            };
            
            this._rev[key] = response._rev;
            return object;
        } else {
            return undefined;
        }
    }

    _logError(error) {
        return undefined;
    }

    create(model) {
        let pouchModel = PouchDocument(model.identifier.key, model);
        
        return this.pouchDB.put(pouchModel).then(this._getModel.bind(this), this._logError.bind(this));
    }

    update(model) {
       let updateModel = PouchDocument(model.identifier.key, model, this._rev[model.identifier.key]);

       return this.pouchDB.put(updateModel);
    }
}