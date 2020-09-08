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
import ActionCollection from './ActionCollection';
import _ from 'lodash';
import { throws } from 'assert';

class ActionsAPI extends EventEmitter {
    constructor(openmct) {
        super();

        this._allActions = {};
        this._actionCollections = {};
        this._openmct = openmct;

        this._groupOrder = ['windowing', 'undefined', 'view', 'action', 'json'];

        this.register = this.register.bind(this);
        this.get = this.get.bind(this);
        this._applicableActions = this._applicableActions.bind(this);
        this._updateCachedActionCollections = this._updateCachedActionCollections.bind(this);
    }

    register(actionDefinition) {
        this._allActions[actionDefinition.key] = actionDefinition;
    }

    get(objectPath, viewContext) {

        if (viewContext && viewContext.getViewKey) {
            let key = viewContext.getViewKey();
            let cachedActionCollection = this._actionCollections[key];

            if (cachedActionCollection) {
                return cachedActionCollection;
            } else {
                let applicableActions = this._applicableActions(objectPath, viewContext);
                let actionCollection = new ActionCollection(key, applicableActions, objectPath, viewContext, this._openmct);

                this._actionCollections[key] = actionCollection;
                actionCollection.on('destroy', this._updateCachedActionCollections);
                
                return actionCollection;
            }
        } else {
            let applicableActions = this._applicableActions(objectPath);

            Object.keys(applicableActions).forEach(key => {
                let action = applicableActions[key];

                action.callBack = () => {
                    return action.invoke(objectPath, viewContext);
                }
            });

            return applicableActions;
        }
    }

    updateGroupOrder(groupArray) {
        this._groupOrder = groupArray;
    }
    
    _updateCachedActionCollections(key) {
        if (this._actionCollections[key]) {
            this._actionCollection[key].off('destroy', this._updateCachedActionCollections);
            this._actionCollections[key] = undefined;
            delete this._actionCollections[key];
        }
    }

    _applicableActions(objectPath, viewContext) {
        let actionsObject = {};

        let keys = Object.keys(this._allActions).filter(key => {
            let actionDefinition = this._allActions[key];

            if (actionDefinition.appliesTo === undefined) {
                return true;
            } else {
                return actionDefinition.appliesTo(objectPath, viewContext);
            }
        });

        keys.forEach(key => {
            let action = _.clone(this._allActions[key]);

            actionsObject[key] = action;
        });

        return actionsObject;
    }

    _groupAndSortActions(actionsArray) {
        if (!Array.isArray(actionsArray) && typeof actionsArray === 'object') {
            actionsArray = Object.keys(actionsArray).map(key => actionsArray[key]);
        }

        let actionsObject = {};
        let groupedSortedActionsArray = [];

        function sortDescending(a, b) {
            return b.priority - a.priority;
        }

        actionsArray.forEach(action => {
            if (actionsObject[action.group] === undefined) {
                actionsObject[action.group] = [action];
            } else {
                actionsObject[action.group].push(action);
            }
        });

        this._groupOrder.forEach(group => {
            let groupArray = actionsObject[group];

            if (groupArray) {
                groupedSortedActionsArray.push(groupArray.sort(sortDescending));
            }
        });

        return groupedSortedActionsArray;
    }
}

export default ActionsAPI;
