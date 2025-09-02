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

/**
 * A collection of actions applicable to a domain object.
 * @extends EventEmitter
 */
class ActionCollection extends EventEmitter {
  /**
   * Creates an instance of ActionCollection.
   * @param {Object.<string, Action>} applicableActions - The actions applicable to the domain object.
   * @param {import('openmct').ObjectPath} objectPath - The path to the domain object.
   * @param {import('openmct').View} view - The view displaying the domain object.
   * @param {import('openmct').OpenMCT} openmct - The Open MCT API.
   * @param {boolean} skipEnvironmentObservers - Whether to skip setting up environment observers.
   */
  constructor(applicableActions, objectPath, view, openmct, skipEnvironmentObservers) {
    super();

    this.applicableActions = applicableActions;
    this.openmct = openmct;
    this.objectPath = objectPath;
    this.view = view;
    this.skipEnvironmentObservers = skipEnvironmentObservers;
    this.objectUnsubscribes = [];

    let debounceOptions = {
      leading: false,
      trailing: true
    };

    this._updateActions = _.debounce(this._updateActions.bind(this), 150, debounceOptions);
    this._update = _.debounce(this._update.bind(this), 150, debounceOptions);

    if (!skipEnvironmentObservers) {
      this._observeObjectPath();
      this.openmct.editor.on('isEditing', this._updateActions);
    }
  }

  /**
   * Disables the specified actions.
   * @param {string[]} actionKeys - The keys of the actions to disable.
   */
  disable(actionKeys) {
    actionKeys.forEach((actionKey) => {
      if (this.applicableActions[actionKey]) {
        this.applicableActions[actionKey].isDisabled = true;
      }
    });
    this._update();
  }

  /**
   * Enables the specified actions.
   * @param {string[]} actionKeys - The keys of the actions to enable.
   */
  enable(actionKeys) {
    actionKeys.forEach((actionKey) => {
      if (this.applicableActions[actionKey]) {
        this.applicableActions[actionKey].isDisabled = false;
      }
    });
    this._update();
  }

  /**
   * Hides the specified actions.
   * @param {string[]} actionKeys - The keys of the actions to hide.
   */
  hide(actionKeys) {
    actionKeys.forEach((actionKey) => {
      if (this.applicableActions[actionKey]) {
        this.applicableActions[actionKey].isHidden = true;
      }
    });
    this._update();
  }

  /**
   * Shows the specified actions.
   * @param {string[]} actionKeys - The keys of the actions to show.
   */
  show(actionKeys) {
    actionKeys.forEach((actionKey) => {
      if (this.applicableActions[actionKey]) {
        this.applicableActions[actionKey].isHidden = false;
      }
    });
    this._update();
  }

  /**
   * Destroys the action collection, removing all listeners and observers.
   */
  destroy() {
    if (!this.skipEnvironmentObservers) {
      this.objectUnsubscribes.forEach((unsubscribe) => {
        unsubscribe();
      });

      this.openmct.editor.off('isEditing', this._updateActions);
    }

    this.emit('destroy', this.view);
    this.removeAllListeners();
  }

  /**
   * Gets all visible actions.
   * @returns {Action[]} An array of visible actions.
   */
  getVisibleActions() {
    let actionsArray = Object.keys(this.applicableActions);
    let visibleActions = [];

    actionsArray.forEach((actionKey) => {
      let action = this.applicableActions[actionKey];

      if (!action.isHidden) {
        visibleActions.push(action);
      }
    });

    return visibleActions;
  }

  /**
   * Gets all actions that should be shown in the status bar.
   * @returns {Action[]} An array of status bar actions.
   */
  getStatusBarActions() {
    let actionsArray = Object.keys(this.applicableActions);
    let statusBarActions = [];

    actionsArray.forEach((actionKey) => {
      let action = this.applicableActions[actionKey];

      if (action.showInStatusBar && !action.isDisabled && !action.isHidden) {
        statusBarActions.push(action);
      }
    });

    return statusBarActions;
  }

  /**
   * Gets the object containing all applicable actions.
   * @returns {Object.<string, Action>} The object of applicable actions.
   */
  getActionsObject() {
    return this.applicableActions;
  }

  /**
   * Emits an update event with the current applicable actions.
   * @private
   */
  _update() {
    this.emit('update', this.applicableActions);
  }

  /**
   * Sets up observers for the object path.
   * @private
   */
  _observeObjectPath() {
    let actionCollection = this;

    /**
     * Updates an object with new properties.
     * @param {Object} oldObject - The object to update.
     * @param {Object} newObject - The object containing new properties.
     */
    function updateObject(oldObject, newObject) {
      Object.assign(oldObject, newObject);

      actionCollection._updateActions();
    }

    this.objectPath.forEach((object) => {
      if (object) {
        let unsubscribe = this.openmct.objects.observe(
          object,
          '*',
          updateObject.bind(this, object)
        );

        this.objectUnsubscribes.push(unsubscribe);
      }
    });
  }

  /**
   * Updates the applicable actions.
   * @private
   */
  _updateActions() {
    let newApplicableActions = this.openmct.actions._applicableActions(this.objectPath, this.view);

    this.applicableActions = this._mergeOldAndNewActions(
      this.applicableActions,
      newApplicableActions
    );
    this._update();
  }

  /**
   * Merges old and new actions, preserving existing action states.
   * @param {Object.<string, Action>} oldActions - The existing actions.
   * @param {Object.<string, Action>} newActions - The new actions.
   * @returns {Object.<string, Action>} The merged actions.
   * @private
   */
  _mergeOldAndNewActions(oldActions, newActions) {
    let mergedActions = {};
    Object.keys(newActions).forEach((key) => {
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

/**
 * @typedef {import('openmct').Action} Action
 */
