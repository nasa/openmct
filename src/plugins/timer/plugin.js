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

import TimerViewProvider from './TimerViewProvider';

import PauseTimerAction from './actions/PauseTimerAction';
import RestartTimerAction from './actions/RestartTimerAction';
import StartTimerAction from './actions/StartTimerAction';
import StopTimerAction from './actions/StopTimerAction';

export default function TimerPlugin() {
  return function install(openmct) {
    openmct.types.addType('timer', {
      name: 'Timer',
      description:
        'A timer that counts up or down to a datetime. Timers can be started, stopped and reset whenever needed, and support a variety of display formats. Each Timer displays the same value to all users. Timers can be added to Display Layouts.',
      creatable: true,
      cssClass: 'icon-timer',
      initialize: function (domainObject) {
        domainObject.configuration = {
          timerFormat: 'long',
          timestamp: undefined,
          timezone: 'UTC',
          timerState: undefined,
          pausedTime: undefined
        };
      },
      form: [
        {
          key: 'timestamp',
          control: 'datetime',
          name: 'Target',
          property: ['configuration', 'timestamp']
        },
        {
          key: 'timerFormat',
          name: 'Display Format',
          control: 'select',
          options: [
            {
              value: 'long',
              name: 'DDD hh:mm:ss'
            },
            {
              value: 'short',
              name: 'hh:mm:ss'
            }
          ],
          property: ['configuration', 'timerFormat']
        }
      ]
    });
    openmct.objectViews.addProvider(new TimerViewProvider(openmct));

    openmct.actions.register(new PauseTimerAction(openmct));
    openmct.actions.register(new RestartTimerAction(openmct));
    openmct.actions.register(new StartTimerAction(openmct));
    openmct.actions.register(new StopTimerAction(openmct));

    openmct.objects.addGetInterceptor({
      appliesTo: (identifier, domainObject) => {
        return domainObject && domainObject.type === 'timer';
      },
      invoke: (identifier, domainObject) => {
        if (domainObject.configuration) {
          return domainObject;
        }

        const configuration = {};

        if (domainObject.timerFormat) {
          configuration.timerFormat = domainObject.timerFormat;
        }

        if (domainObject.timestamp) {
          configuration.timestamp = domainObject.timestamp;
        }

        if (domainObject.timerState) {
          configuration.timerState = domainObject.timerState;
        }

        if (domainObject.pausedTime) {
          configuration.pausedTime = domainObject.pausedTime;
        }

        openmct.objects.mutate(domainObject, 'configuration', configuration);

        return domainObject;
      }
    });
  };
}
