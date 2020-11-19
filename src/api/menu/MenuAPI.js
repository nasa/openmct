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

        this.showMenu = this.showMenu.bind(this);
        this._clearMenuComponent = this._clearMenuComponent.bind(this);
        this._showObjectMenu = this._showObjectMenu.bind(this);
    }

    showMenu(x, y, actions) {
        if (this.menuComponent) {
            this.menuComponent.dismiss();
        }

        let options = {
            x,
            y,
            actions
        };

        this.menuComponent = new Menu(options);
        this.menuComponent.once('destroy', this._clearMenuComponent);
    }

    _clearMenuComponent() {
        this.menuComponent = undefined;
        delete this.menuComponent;
    }

    _showObjectMenu(objectPath, x, y, actionsToBeIncluded) {
        let applicableActions = this.openmct.actions._groupedAndSortedObjectActions(objectPath, actionsToBeIncluded);

        this.showMenu(x, y, applicableActions);
    }
}
export default MenuAPI;
