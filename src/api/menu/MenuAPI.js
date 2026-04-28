/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import Menu, { MENU_PLACEMENT } from './menu.js';

/**
 * The MenuAPI allows the addition of new context menu actions, and for the context menu to be launched from
 * custom HTML elements.
 */
class MenuAPI {
  /**
   * @param {import('openmct').OpenMCT} openmct
   */
  constructor(openmct) {
    this.openmct = openmct;

    this.menuPlacement = MENU_PLACEMENT;
    this.showMenu = this.showMenu.bind(this);
    this.showSuperMenu = this.showSuperMenu.bind(this);

    this._clearMenuComponent = this._clearMenuComponent.bind(this);
    this._showObjectMenu = this._showObjectMenu.bind(this);
  }

  /**
   * Show popup menu
   * @param {number} x - x-coordinates for popup
   * @param {number} y - y-coordinates for popup
   * @param {Action[]|Action[][]} items - collection of actions or collection of groups of actions
   * @param {MenuOptions} [menuOptions] - The options for Menu
   */
  showMenu(x, y, items, menuOptions) {
    this._createMenuComponent(x, y, items, menuOptions);

    this.menuComponent.showMenu();
  }

  /**
   * Convert actions to menu items
   * @param {Action[]} actions - collection of actions
   * @param {import('openmct').ObjectPath} objectPath - The object path
   * @param {import('openmct').ViewProvider} view - The view provider
   * @returns {Action[]}
   */
  actionsToMenuItems(actions, objectPath, view) {
    return actions.map((action) => {
      const isActionGroup = Array.isArray(action);
      if (isActionGroup) {
        action = this.actionsToMenuItems(action, objectPath, view);
      } else {
        action.onItemClicked = () => action.invoke(objectPath, view);
      }

      return action;
    });
  }

  /**
   * Show popup menu with description of item on hover
   * @param {number} x - x-coordinates for popup
   * @param {number} y - y-coordinates for popup
   * @param {Action[]|Action[][]} actions - collection of actions or collection of groups of actions
   * @param {MenuOptions} [menuOptions] - The options for Menu
   */
  showSuperMenu(x, y, actions, menuOptions) {
    this._createMenuComponent(x, y, actions, menuOptions);

    this.menuComponent.showSuperMenu();
  }

  /**
   * Clear the menu component
   * @private
   */
  _clearMenuComponent() {
    this.menuComponent = undefined;
    delete this.menuComponent;
  }

  /**
   * Create a menu component
   * @param {number} x - x-coordinates for popup
   * @param {number} y - y-coordinates for popup
   * @param {Action[]|Action[][]} actions - collection of actions or collection of groups of actions
   * @param {MenuOptions} menuOptions - The options for Menu
   * @private
   */
  _createMenuComponent(x, y, actions, menuOptions = {}) {
    if (this.menuComponent) {
      this.menuComponent.dismiss();
    }

    let options = {
      x,
      y,
      actions,
      ...menuOptions
    };

    this.menuComponent = new Menu(options);
    this.menuComponent.once('destroy', this._clearMenuComponent);
  }

  /**
   * Show object menu
   * @param {import('openmct').ObjectPath} objectPath - The object path
   * @param {number} x - x-coordinates for popup
   * @param {number} y - y-coordinates for popup
   * @param {string[]} actionsToBeIncluded - Actions to be included in the menu
   * @private
   */
  _showObjectMenu(objectPath, x, y, actionsToBeIncluded) {
    let applicableActions = this.openmct.actions._groupedAndSortedObjectActions(
      objectPath,
      actionsToBeIncluded
    );

    this.showMenu(x, y, applicableActions);
  }
}
export default MenuAPI;

/**
 * @typedef {Object} MenuOptions
 * @property {string} [menuClass] - Class for popup menu
 * @property {MENU_PLACEMENT} [placement] - Placement for menu relative to click
 * @property {() => void} [onDestroy] - callback function: invoked when menu is destroyed
 */

/**
 * @typedef {import('openmct').Action} Action
 */
