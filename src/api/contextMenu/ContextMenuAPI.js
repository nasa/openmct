/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

/**
 * The ContextMenuAPI allows the addition of new context menu actions, and for the context menu to be launched from
 * custom HTML elements.
 * @interface ContextMenuAPI
 * @memberof module:openmct
 */
class ContextMenuAPI {
    constructor(openmct) {
        this.openmct = openmct;
        this._allActions = [];

        this.registerAction = this.registerAction.bind(this);
    }

    /**
     * Defines an item to be added to context menus. Allows specification of text, appearance, and behavior when
     * selected. Applicabilioty can be restricted by specification of an `appliesTo` function.
     *
     * @interface ContextMenuAction
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
    registerAction(actionDefinition) {
        this._allActions.push(actionDefinition);
    }

    /**
     * @private
     */
    _showContextMenuForObjectPath(objectPath, x, y, actionsToBeIncluded) {

        let applicableActions = this._applicableActions(objectPath, actionsToBeIncluded);

        this.openmct.overlays.menu({
            actions: applicableActions,
            x,
            y
        });
    }

    /**
     * @private
     */
    _applicableActions(objectPath, actionsToBeIncluded) {
        let applicableActions = this._allActions.filter((action) => {
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

        return applicableActions;
    }
}
export default ContextMenuAPI;
