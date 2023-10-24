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

import momentTimezone from 'moment-timezone';
import mount from 'utils/mount';

import ClockViewProvider from './ClockViewProvider';
import ClockIndicator from './components/ClockIndicator.vue';

export default function ClockPlugin(options) {
  return function install(openmct) {
    const CLOCK_INDICATOR_FORMAT = 'YYYY/MM/DD HH:mm:ss';
    openmct.types.addType('clock', {
      name: 'Clock',
      description:
        'A digital clock that uses system time and supports a variety of display formats and timezones.',
      creatable: true,
      cssClass: 'icon-clock',
      initialize: function (domainObject) {
        domainObject.configuration = {
          baseFormat: 'YYYY/MM/DD hh:mm:ss',
          use24: 'clock12',
          timezone: 'UTC'
        };
      },
      form: [
        {
          key: 'displayFormat',
          name: 'Display Format',
          control: 'select',
          options: [
            {
              value: 'YYYY/MM/DD hh:mm:ss',
              name: 'YYYY/MM/DD hh:mm:ss'
            },
            {
              value: 'YYYY/DDD hh:mm:ss',
              name: 'YYYY/DDD hh:mm:ss'
            },
            {
              value: 'hh:mm:ss',
              name: 'hh:mm:ss'
            }
          ],
          cssClass: 'l-inline',
          property: ['configuration', 'baseFormat']
        },
        {
          ariaLabel: '12 or 24 hour clock',
          control: 'select',
          options: [
            {
              value: 'clock12',
              name: '12hr'
            },
            {
              value: 'clock24',
              name: '24hr'
            }
          ],
          cssClass: 'l-inline',
          property: ['configuration', 'use24']
        },
        {
          key: 'timezone',
          name: 'Timezone',
          control: 'autocomplete',
          cssClass: 'c-clock__timezone-selection c-menu--no-icon',
          options: momentTimezone.tz.names(),
          property: ['configuration', 'timezone']
        }
      ]
    });
    openmct.objectViews.addProvider(new ClockViewProvider(openmct));

    if (options && options.enableClockIndicator === true) {
      const element = document.createElement('div');

      const { vNode } = mount(
        {
          components: {
            ClockIndicator
          },
          provide: {
            openmct
          },
          data() {
            return {
              indicatorFormat: CLOCK_INDICATOR_FORMAT
            };
          },
          template: '<ClockIndicator :indicator-format="indicatorFormat" />'
        },
        {
          app: openmct.app,
          element
        }
      );
      const indicator = {
        element: vNode.el,
        key: 'clock-indicator',
        priority: openmct.priority.LOW
      };
      openmct.indicators.add(indicator);
    }

    openmct.objects.addGetInterceptor({
      appliesTo: (identifier, domainObject) => {
        return domainObject && domainObject.type === 'clock';
      },
      invoke: (identifier, domainObject) => {
        if (domainObject.configuration) {
          return domainObject;
        }

        if (domainObject.clockFormat && domainObject.timezone) {
          const baseFormat = domainObject.clockFormat[0];
          const use24 = domainObject.clockFormat[1];
          const timezone = domainObject.timezone;

          domainObject.configuration = {
            baseFormat,
            use24,
            timezone
          };

          openmct.objects.mutate(domainObject, 'configuration', domainObject.configuration);
        }

        return domainObject;
      }
    });
  };
}
