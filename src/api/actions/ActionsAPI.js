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
import { timingSafeEqual } from 'crypto';

class ActionsAPI extends EventEmitter {
    constructor() {
        super();

        this._viewActions = {};
        this._objectActions = [];

        this._groupOrder = ['windowing', 'undefined', 'view', 'action', 'json'];

        this.registerObjectAction = this.registerObjectAction.bind(this);
        this.registerViewAction = this.registerViewAction.bind(this);
        this.removeAllViewActions = this.removeAllViewActions.bind(this);
        this._applicableObjectActions = this._applicableObjectActions.bind(this);
        this._groupedAndSortedObjectActions = this._groupedAndSortedObjectActions.bind(this);
        this._applicableViewActions = this._applicableViewActions.bind(this);
        this._applicableActions = this._applicableActions.bind(this);
    }

    registerObjectAction(actionDefinition) {
        this._objectActions.push(actionDefinition);
    }

    registerViewAction(viewKey, actionDefinition) {

        if (Array.isArray(actionDefinition)) {
            this._viewActions[viewKey] = actionDefinition;
        } else {
            if (this._viewActions[viewKey]) {
                this._viewActions[viewKey].push(actionDefinition);
            } else {
                this._viewActions[viewKey] = [actionDefinition];
            }
        }
    }

    updateViewActions(viewKey, actionDefinitionsArray) {
        this._viewActions[viewKey] = actionDefinitionsArray;
        this.emit('update', viewKey, actionDefinitionsArray);
    }

    removeAllViewActions(viewKey) {
        this._viewActions[viewKey] = undefined;
        delete this._viewActions[viewKey];

        this.emit('update', viewKey, []);
    }

    _applicableObjectActions(objectPath, actionsToBeIncluded) {
        let applicableActions = this._objectActions.filter((action) => {
            if (actionsToBeIncluded) {
                if (action.appliesTo === undefined && actionsToBeIncluded.includes(action.key)) {
                    return true;
                }

                return action.appliesTo(objectPath, actionsToBeIncluded) && actionsToBeIncluded.includes(action.key);
            } else {
                if (action.appliesTo === undefined) {
                    return true;
                }

                return action.appliesTo(objectPath, actionsToBeIncluded) && !action.hideInDefaultMenu;
            }
        });

        applicableActions.forEach(action => {
            action.callBack = () => {
                return action.invoke(objectPath);
            };
        });

        return applicableActions;
    }

    _groupedAndSortedObjectActions(objectPath, actionsToBeIncluded) {
        let actions = this._applicableObjectActions(objectPath, actionsToBeIncluded);

        return this._groupAndSortActions(actions);
    }

    _applicableViewActions(viewKey) {
        return this._viewActions[viewKey] || [];
    }

    _applicableActions(objectPath, viewKey, actionsToBeIncluded) {
        let objectActions = this._applicableObjectActions(objectPath, actionsToBeIncluded);
        let viewActions = this._applicableViewActions(viewKey);
        let combinedActions = objectActions.concat(viewActions);

        return this._groupAndSortActions(combinedActions);
    }

    _groupAndSortActions(actionsArray) {
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
