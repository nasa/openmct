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
import { EventEmitter } from 'eventemitter3';
import _ from 'lodash';

import ActionCollection from './ActionCollection.js';

/**
 * The ActionsAPI manages the registration and retrieval of actions in Open MCT.
 * @extends EventEmitter
 */
class ActionsAPI extends EventEmitter {
  /**
   * @param {import('openmct').OpenMCT} openmct - The Open MCT instance
   */
  constructor(openmct) {
    super();

    /** @type {Object<string, Action>} */
    this._allActions = {};
    /** @type {WeakMap<Object, ActionCollection>} */
    this._actionCollections = new WeakMap();
    /** @type {import('openmct').OpenMCT} */
    this._openmct = openmct;

    /** @type {string[]} */
    this._groupOrder = ['windowing', 'undefined', 'view', 'action', 'export', 'import'];

    this.register = this.register.bind(this);
    this.getActionsCollection = this.getActionsCollection.bind(this);
    this._applicableActions = this._applicableActions.bind(this);
    this._updateCachedActionCollections = this._updateCachedActionCollections.bind(this);
  }

  /**
   * Register an action with the API.
   * @param {Action} actionDefinition - The definition of the action to register
   */
  register(actionDefinition) {
    this._allActions[actionDefinition.key] = actionDefinition;
  }

  /**
   * Get an action by its key.
   * @param {string} key - The key of the action to retrieve
   * @returns {Action|undefined} The action definition, or undefined if not found
   */
  getAction(key) {
    return this._allActions[key];
  }

  /**
   * Get or create an ActionCollection for a given object path and view.
   * @param {import('openmct').ObjectPath} objectPath - The path of the object
   * @param {import('openmct').View} [view] - The view object
   * @returns {ActionCollection} The ActionCollection for the given object path and view
   */
  getActionsCollection(objectPath, view) {
    if (view) {
      return (
        this._getCachedActionCollection(objectPath, view) ||
        this._newActionCollection(objectPath, view, true)
      );
    } else {
      return this._newActionCollection(objectPath, view, true);
    }
  }

  /**
   * Update the order in which action groups are displayed.
   * @param {string[]} groupArray - An array of group names in the desired order
   */
  updateGroupOrder(groupArray) {
    this._groupOrder = groupArray;
  }

  /**
   * Get a cached ActionCollection for a given view.
   * @param {import('openmct').ObjectPath} objectPath - The path of the object
   * @param {Object} view - The view object
   * @returns {ActionCollection|undefined} The cached ActionCollection, or undefined if not found
   */
  _getCachedActionCollection(objectPath, view) {
    return this._actionCollections.get(view);
  }

  /**
   * Create a new ActionCollection.
   * @param {import('openmct').ObjectPath} objectPath - The path of the object
   * @param {import('openmct').View} [view] - The view object
   * @param {boolean} skipEnvironmentObservers - Whether to skip environment observers
   * @returns {ActionCollection} The new ActionCollection
   */
  _newActionCollection(objectPath, view, skipEnvironmentObservers) {
    let applicableActions = this._applicableActions(objectPath, view);

    const actionCollection = new ActionCollection(
      applicableActions,
      objectPath,
      view,
      this._openmct,
      skipEnvironmentObservers
    );
    if (view) {
      this._cacheActionCollection(view, actionCollection);
    }

    return actionCollection;
  }

  /**
   * Cache an ActionCollection for a given view.
   * @param {import('openmct').View} view - The view object
   * @param {ActionCollection} actionCollection - The ActionCollection to cache
   */
  _cacheActionCollection(view, actionCollection) {
    this._actionCollections.set(view, actionCollection);
    actionCollection.on('destroy', this._updateCachedActionCollections);
  }

  /**
   * Update cached ActionCollections when destroyed.
   * @param {import('openmct').View} view - The key (View object)of the destroyed ActionCollection
   */
  _updateCachedActionCollections(view) {
    if (this._actionCollections.has(view)) {
      let actionCollection = this._actionCollections.get(view);
      actionCollection.off('destroy', this._updateCachedActionCollections);
      delete actionCollection.applicableActions;
      this._actionCollections.delete(view);
    }
  }

  /**
   * Get applicable actions for a given object path and view.
   * @param {import('openmct').ObjectPath} objectPath - The path of the object
   * @param {import('openmct').View} [view] - The view object
   * @returns {Object<string, Action>} A dictionary of applicable actions keyed by action key
   */
  _applicableActions(objectPath, view) {
    let actionsObject = {};

    let keys = Object.keys(this._allActions).filter((key) => {
      let actionDefinition = this._allActions[key];

      if (actionDefinition.appliesTo === undefined) {
        return true;
      } else {
        return actionDefinition.appliesTo(objectPath, view);
      }
    });

    keys.forEach((key) => {
      let action = _.clone(this._allActions[key]);

      actionsObject[key] = action;
    });

    return actionsObject;
  }

  /**
   * Group and sort actions based on their group and priority.
   * @param {Action[]|Object<string, Action>} actionsArray - An array or object of actions to group and sort
   * @returns {Action[][]} An array of grouped and sorted action arrays
   */
  _groupAndSortActions(actionsArray = []) {
    if (!Array.isArray(actionsArray) && typeof actionsArray === 'object') {
      actionsArray = Object.keys(actionsArray).map((key) => actionsArray[key]);
    }

    let actionsObject = {};
    let groupedSortedActionsArray = [];

    function sortDescending(a, b) {
      return b.priority - a.priority;
    }

    actionsArray.forEach((action) => {
      if (actionsObject[action.group] === undefined) {
        actionsObject[action.group] = [action];
      } else {
        actionsObject[action.group].push(action);
      }
    });

    this._groupOrder.forEach((group) => {
      let groupArray = actionsObject[group];

      if (groupArray) {
        groupedSortedActionsArray.push(groupArray.sort(sortDescending));
      }
    });

    return groupedSortedActionsArray;
  }
}

export default ActionsAPI;

/**
 * @typedef {Object} Action
 * @property {string} name - The display name of the action.
 * @property {string} key - A unique identifier for the action.
 * @property {string} description - A brief description of what the action does.
 * @property {string} cssClass - The CSS class for the action's icon.
 * @property {string} [group] - The group this action belongs to (e.g., 'action', 'import').
 * @property {number} [priority] - The priority of the action within its group (controls the order of the actions in the menu).
 * @property {boolean} [isHidden] - Whether the action should be hidden from menus.
 * @property {(objectPath: ObjectPath, view: View) => void} invoke - Executes the action.
 * @property {(objectPath: ObjectPath, view: View) => boolean} appliesTo - Determines if the action is applicable to the given object path.
 */

/** @typedef {import('openmct').ObjectPath} ObjectPath */
/** @typedef {import('openmct').View} View */
