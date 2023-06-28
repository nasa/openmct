/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

export default class RestartTimerAction {
  constructor(openmct) {
    this.name = 'Restart at 0';
    this.key = 'timer.restart';
    this.description = 'Restart the currently displayed timer';
    this.group = 'view';
    this.cssClass = 'icon-refresh';
    this.priority = 2;

    this.openmct = openmct;
  }
  invoke(objectPath) {
    const domainObject = objectPath[0];
    if (!domainObject || !domainObject.configuration) {
      return new Error('Unable to run restart timer action. No domainObject provided.');
    }

    const newConfiguration = { ...domainObject.configuration };
    newConfiguration.timerState = 'started';
    newConfiguration.timestamp = new Date();
    newConfiguration.pausedTime = undefined;

    this.openmct.objects.mutate(domainObject, 'configuration', newConfiguration);
  }
  appliesTo(objectPath, view = {}) {
    const domainObject = objectPath[0];
    if (!domainObject || !domainObject.configuration) {
      return;
    }

    // Use object configuration timerState for viewless context menus,
    // otherwise manually show/hide based on the view's timerState
    const viewKey = view.key;
    const { timerState } = domainObject.configuration;

    return viewKey
      ? domainObject.type === 'timer'
      : domainObject.type === 'timer' && timerState !== 'stopped';
  }
}
