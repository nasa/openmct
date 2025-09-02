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
import { v4 as uuid } from 'uuid';

import ConditionSetCompositionPolicy from './ConditionSetCompositionPolicy.js';
import ConditionSetMetadataProvider from './ConditionSetMetadataProvider.js';
import ConditionSetTelemetryProvider from './ConditionSetTelemetryProvider.js';
import ConditionSetViewProvider from './ConditionSetViewProvider.js';

export default function ConditionPlugin() {
  return function install(openmct) {
    openmct.types.addType('conditionSet', {
      name: 'Condition Set',
      key: 'conditionSet',
      description:
        'Monitor and evaluate telemetry values in real-time with a wide variety of criteria. Use to control the styling of many objects in Open MCT.',
      creatable: true,
      cssClass: 'icon-conditional',
      initialize: function (domainObject) {
        domainObject.configuration = {
          conditionTestData: [],
          conditionCollection: [
            {
              isDefault: true,
              id: uuid(),
              configuration: {
                name: 'Default',
                output: 'Default',
                trigger: 'all',
                criteria: []
              },
              summary: 'Default condition'
            }
          ]
        };
        domainObject.composition = [];
        domainObject.telemetry = {};
      }
    });
    let compositionPolicy = new ConditionSetCompositionPolicy(openmct);
    openmct.composition.addPolicy(compositionPolicy.allow.bind(compositionPolicy));
    openmct.telemetry.addProvider(new ConditionSetMetadataProvider(openmct));
    openmct.telemetry.addProvider(new ConditionSetTelemetryProvider(openmct));
    openmct.objectViews.addProvider(new ConditionSetViewProvider(openmct));
  };
}
