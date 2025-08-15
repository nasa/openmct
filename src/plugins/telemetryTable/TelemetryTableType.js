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

import { MODE } from './constants.js';

export default function getTelemetryTableType(options) {
  let { telemetryMode, persistModeChange, rowLimit } = options;

  return {
    name: 'Telemetry Table',
    description:
      'Display values for one or more telemetry end points in a scrolling table. Each row is a time-stamped value.',
    creatable: true,
    cssClass: 'icon-tabular-scrolling',
    form: [
      {
        key: 'telemetryMode',
        name: 'Data Mode',
        control: 'select',
        options: [
          {
            value: MODE.PERFORMANCE,
            name: 'Limited (Performance) Mode'
          },
          {
            value: MODE.UNLIMITED,
            name: 'Unlimited Mode'
          }
        ],
        cssClass: 'l-inline',
        property: ['configuration', 'telemetryMode']
      },
      {
        name: 'Persist Data Mode Changes',
        control: 'toggleSwitch',
        cssClass: 'l-input',
        key: 'persistModeChange',
        property: ['configuration', 'persistModeChange']
      },
      {
        name: 'Limited Data Mode Row Limit',
        control: 'numberfield',
        cssClass: 'l-input',
        key: 'rowLimit',
        property: ['configuration', 'rowLimit']
      }
    ],
    initialize(domainObject) {
      domainObject.composition = [];
      domainObject.configuration = {
        columnWidths: {},
        hiddenColumns: {},
        telemetryMode,
        persistModeChange,
        rowLimit
      };
    }
  };
}
