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

import moment from 'moment';

export default class StartTimerAction {
  constructor(openmct) {
    this.name = 'Start';
    this.key = 'timer.start';
    this.description = 'Start the currently displayed timer';
    this.group = 'view';
    this.cssClass = 'icon-play';
    this.priority = 3;

    this.openmct = openmct;
  }
  invoke(objectPath) {
    const domainObject = objectPath[0];
    if (!domainObject || !domainObject.configuration) {
      return new Error('Unable to run start timer action. No domainObject provided.');
    }

    let { pausedTime, timestamp } = domainObject.configuration;
    const newConfiguration = { ...domainObject.configuration };

    if (pausedTime) {
      pausedTime = moment(pausedTime);
    }

    if (timestamp) {
      timestamp = moment(timestamp);
    }

    const now = moment(new Date(this.openmct.time.now()));
    if (pausedTime) {
      const timeShift = moment.duration(now.diff(pausedTime));
      const shiftedTime = timestamp.add(timeShift);
      newConfiguration.timestamp = shiftedTime.toDate();
    } else if (!timestamp) {
      newConfiguration.timestamp = now.toDate();
    }

    newConfiguration.timerState = 'started';
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
      : domainObject.type === 'timer' && timerState !== 'started';
  }
}
