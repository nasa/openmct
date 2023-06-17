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

import GaugeViewProvider from './GaugeViewProvider';
import GaugeFormController from './components/GaugeFormController.vue';
import Vue from 'vue';

export const GAUGE_TYPES = [
  ['Filled Dial', 'dial-filled'],
  ['Needle Dial', 'dial-needle'],
  ['Vertical Meter', 'meter-vertical'],
  ['Vertical Meter Inverted', 'meter-vertical-inverted'],
  ['Horizontal Meter', 'meter-horizontal']
];

export default function () {
  return function install(openmct) {
    openmct.objectViews.addProvider(new GaugeViewProvider(openmct));

    openmct.forms.addNewFormControl('gauge-controller', getGaugeFormController(openmct));
    openmct.types.addType('gauge', {
      name: 'Gauge',
      creatable: true,
      description:
        "Graphically visualize a telemetry element's current value between a minimum and maximum.",
      cssClass: 'icon-gauge',
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          gaugeController: {
            gaugeType: GAUGE_TYPES[0][1],
            isDisplayMinMax: true,
            isDisplayCurVal: true,
            isDisplayUnits: true,
            isUseTelemetryLimits: true,
            limitLow: 10,
            limitHigh: 90,
            max: 100,
            min: 0,
            precision: 2
          }
        };
      },
      form: [
        {
          name: 'Gauge type',
          options: GAUGE_TYPES.map((type) => {
            return {
              name: type[0],
              value: type[1]
            };
          }),
          control: 'select',
          cssClass: 'l-input-sm',
          key: 'gaugeController',
          property: ['configuration', 'gaugeController', 'gaugeType']
        },
        {
          name: 'Display current value',
          control: 'toggleSwitch',
          cssClass: 'l-input',
          key: 'isDisplayCurVal',
          property: ['configuration', 'gaugeController', 'isDisplayCurVal']
        },
        {
          name: 'Display units',
          control: 'toggleSwitch',
          cssClass: 'l-input',
          key: 'isDisplayUnits',
          property: ['configuration', 'gaugeController', 'isDisplayUnits']
        },
        {
          name: 'Display range values',
          control: 'toggleSwitch',
          cssClass: 'l-input',
          key: 'isDisplayMinMax',
          property: ['configuration', 'gaugeController', 'isDisplayMinMax']
        },
        {
          name: 'Float precision',
          control: 'numberfield',
          cssClass: 'l-input-sm',
          key: 'precision',
          property: ['configuration', 'gaugeController', 'precision']
        },
        {
          name: 'Value ranges and limits',
          control: 'gauge-controller',
          cssClass: 'l-input',
          key: 'gaugeController',
          required: false,
          hideFromInspector: true,
          property: ['configuration', 'gaugeController'],
          validate: ({ value }, callback) => {
            if (value.isUseTelemetryLimits) {
              return true;
            }

            const { min, max, limitLow, limitHigh } = value;
            const valid = {
              min: true,
              max: true,
              limitLow: true,
              limitHigh: true
            };

            if (min === '') {
              valid.min = false;
            }

            if (max === '') {
              valid.max = false;
            }

            if (max < min) {
              valid.min = false;
              valid.max = false;
            }

            if (limitLow !== '') {
              valid.limitLow = min <= limitLow && limitLow < max;
            }

            if (limitHigh !== '') {
              valid.limitHigh = min < limitHigh && limitHigh <= max;
            }

            if (
              valid.limitLow &&
              valid.limitHigh &&
              limitLow !== '' &&
              limitHigh !== '' &&
              limitLow > limitHigh
            ) {
              valid.limitLow = false;
              valid.limitHigh = false;
            }

            if (callback) {
              callback(valid);
            }

            return valid.min && valid.max && valid.limitLow && valid.limitHigh;
          }
        }
      ]
    });
  };

  function getGaugeFormController(openmct) {
    return {
      show(element, model, onChange) {
        const rowComponent = new Vue({
          el: element,
          components: {
            GaugeFormController
          },
          provide: {
            openmct
          },
          data() {
            return {
              model,
              onChange
            };
          },
          template: `<GaugeFormController :model="model" @onChange="onChange"></GaugeFormController>`
        });

        return rowComponent;
      }
    };
  }
}
