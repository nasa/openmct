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

import mount from 'utils/mount';
import TableConfigurationComponent from './components/table-configuration.vue';
import TelemetryTableConfiguration from './TelemetryTableConfiguration';

export default function TableConfigurationViewProvider(openmct) {
  return {
    key: 'table-configuration',
    name: 'Configuration',
    canView: function (selection) {
      if (selection.length !== 1 || selection[0].length === 0) {
        return false;
      }

      let object = selection[0][0].context.item;

      return object && object.type === 'table';
    },
    view: function (selection) {
      let _destroy = null;
      let tableConfiguration;
      const domainObject = selection[0][0].context.item;

      return {
        show: function (element) {
          tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);
          const { destroy } = mount(
            {
              el: element,
              components: {
                TableConfiguration: TableConfigurationComponent
              },
              provide: {
                openmct,
                tableConfiguration
              },
              template: '<table-configuration></table-configuration>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
        },
        showTab: function (isEditing) {
          return isEditing;
        },
        priority: function () {
          return 1;
        },
        destroy: function () {
          if (_destroy) {
            _destroy();
          }

          tableConfiguration = undefined;
        }
      };
    }
  };
}
