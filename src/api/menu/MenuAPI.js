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

import Menu from './menu.js';

/**
 * The MenuAPI allows the addition of new context menu actions, and for the context menu to be launched from
 * custom HTML elements.
 * @interface MenuAPI
 * @memberof module:openmct
 */

class MenuAPI {
    constructor(openmct) {
        this.openmct = openmct;
        this._allObjectActions = [];
        this._groupOrder = ['windowing', 'undefined', 'view', 'action', 'json'];

        this.showMenu = this.showMenu.bind(this);
        this.registerObjectAction = this.registerObjectAction.bind(this);
        this._clearMenuComponent = this._clearMenuComponent.bind(this);
        this._applicableObjectActions = this._applicableObjectActions.bind(this);
        this._showObjectMenu = this._showObjectMenu.bind(this);
    }

    /**
     * Defines an item to be added to context menus. Allows specification of text, appearance, and behavior when
     * selected. Applicabilioty can be restricted by specification of an `appliesTo` function.
     *
     * @interface ObjectAction
     * @memberof module:openmct
     * @property {string} name the human-readable name of this view
     * @property {string} description a longer-form description (typically
     *           a single sentence or short paragraph) of this kind of view
     * @property {string} cssClass the CSS class to apply to labels for this
     *           view (to add icons, for instance)
     * @property {string} key unique key to identify the context menu action
     *           (used in custom context menu eg table rows, to identify which actions to include)
     * @property {boolean} hideInDefaultMenu optional flag to hide action from showing in the default context menu (tree item)
     */
    /**
     * @method appliesTo
     * @memberof module:openmct.ContextMenuAction#
     * @param {DomainObject[]} objectPath the path of the object that the context menu has been invoked on.
     * @returns {boolean} true if the action applies to the objects specified in the 'objectPath', otherwise false.
     */
    /**
     * Code to be executed when the action is selected from a context menu
     * @method invoke
     * @memberof module:openmct.ContextMenuAction#
     * @param {DomainObject[]} objectPath the path of the object to invoke the action on.
     */
    /**
     * @param {ContextMenuAction} actionDefinition
     */
    registerObjectAction(actionDefinition) {
        this._allObjectActions.push(actionDefinition);
    }

    showMenu(x, y, actions) {
        if (this.menuComponent) {
            this.menuComponent.dismiss();
        }

        let options = {
            x,
            y,
            actions
        }

        this.menuComponent = new Menu(options);
        this.menuComponent.on('destroy', this._clearMenuComponent);
    }

    _clearMenuComponent() {
        this.menuComponent = undefined;
        delete this.menuComponent;
    }

    _applicableObjectActions(objectPath, actionsToBeIncluded) {
        let applicableActions = this._allObjectActions.filter((action) => {
            if (actionsToBeIncluded) {
                if (action.appliesTo === undefined && actionsToBeIncluded.includes(action.key)) {
                    return true;
                }

                return action.appliesTo(objectPath, actionsToBeIncluded) && actionsToBeIncluded.includes(action.key);
            } else {
                if (action.appliesTo === undefined) {
                    return true;
                }

                return action.appliesTo(objectPath) && !action.hideInDefaultMenu;
            }
        });

        applicableActions.forEach(action => {
            action.callBack = () => {
                return action.invoke(objectPath);
            };
        });

        return this._groupAndSortActions(applicableActions);
    }

    _groupAndSortActions(actionsArray) {
        let actionsObject = {};
        let groupedSortedActionsArray = [];

        function sortDescending(a,b) {
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

    _showObjectMenu(objectPath, x, y, actionsToBeIncluded) {
        let applicableActions = this.openmct.actions._applicableObjectActions(objectPath, actionsToBeIncluded);

        this.showMenu(x, y, applicableActions);
    }
}
export default MenuAPI;
