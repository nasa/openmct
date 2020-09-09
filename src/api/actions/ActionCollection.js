/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import EventEmitter from 'EventEmitter';
import _ from 'lodash';

class ActionCollection extends EventEmitter {
    constructor(key, applicableActions, objectPath, viewContext, openmct) {
        super();

        this.key = key;
        this.applicableActions = applicableActions;
        this.openmct = openmct;
        this.objectPath = objectPath;
        this.viewContext = viewContext;
        this.objectUnsubscribes = [];

        this._observeObjectPath();
        this._initializeActions();

        let debounceOptions = {
            leading: false,
            trailing: true
        };

        this._updateActions = _.debounce(this._updateActions, 150, debounceOptions);
        this.update = _.debounce(this.update, 150, debounceOptions);
    }

    disable(actionKeys) {
        actionKeys.forEach(actionKey => {
            if (this.applicableActions[actionKey]) {
                this.applicableActions[actionKey].disabled = true;
            }
        });
    }

    enable(actionKeys) {
        actionKeys.forEach(actionKey => {
            if (this.applicableActions[actionKey]) {
                this.applicableActions[actionKey].disabled = false;
            }
        });
    }

    hide(actionKeys) {
        actionKeys.forEach(actionKey => {
            if (this.applicableActions[actionKey]) {
                this.applicableActions[actionKey].hidden = true;
            }
        });
    }

    show(actionKeys) {
        actionKeys.forEach(actionKey => {
            if (this.applicableActions[actionKey]) {
                this.applicableActions[actionKey].hidden = false;
            }
        });
    }

    update() {
        this.emit('update', this.applicableActions);
    }

    destroy() {
        this.objectUnsubscribes.forEach(unsubscribe => {
            unsubscribe();
        });
        this.objectUnsubscribes = [];
        this.applicableActions = {};
        this.objectPath = [];
        this.viewContext = {};

        this.emit('destroy', this.key);
    }

    _observeObjectPath() {
        let actionCollection = this;

        function updateObject(oldObject, newObject) {
            Object.assign(oldObject, newObject);

            actionCollection._updateActions();
        }

        this.objectPath.forEach(object => {
            if (object) {
                let unsubscribe = this.openmct.objects.observe(object, '*', updateObject.bind(this, object));

                this.objectUnsubscribes.push(unsubscribe);
            }
        });
    }

    _initializeActions() {
        Object.keys(this.applicableActions).forEach(key => {
            this.applicableActions[key].callBack = () => {
                return this.applicableActions[key].invoke(this.objectPath, this.viewContext);
            };
        });
    }

    _updateActions() {
        let newApplicableActions = this.openmct.actions._applicableActions(this.objectPath, this.viewContext);
        
        this.applicableActions = this._mergeOldAndNewActions(this.applicableActions, newApplicableActions);
        this._initializeActions();
        this.update();
    }

    _mergeOldAndNewActions(oldActions, newActions) {
        let mergedActions = {};
        Object.keys(newActions).forEach(key => {
            if (oldActions[key]) {
                mergedActions[key] = oldActions[key];
            } else {
                mergedActions[key] = newActions[key];
            }
        });

        return mergedActions;
    }
}

export default ActionCollection;
