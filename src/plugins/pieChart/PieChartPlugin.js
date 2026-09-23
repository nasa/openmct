/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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

import PieChartInspectorViewProvider from './inspector/PieChartInspectorViewProvider.js';
import PieChartCompositionPolicy from './PieChartCompositionPolicy.js';
import { PIE_CHART_KEY, PIE_CHART_SHAPES } from './PieChartConstants.js';
import PieChartViewProvider from './PieChartViewProvider.js';

export default function PieChartPlugin() {
  return function install(openmct) {
    openmct.types.addType(PIE_CHART_KEY, {
      key: PIE_CHART_KEY,
      name: 'Pie Chart',
      cssClass: 'icon-object',
      description: 'Graphically visualize telemetry values as wedges of a pie or donut chart.',
      creatable: true,
      initialize: function (domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          pieChartController: {
            shape: PIE_CHART_SHAPES[0][1],
            target: 100,
            highlightedKey: ''
          }
        };
      }
    });

    openmct.objectViews.addProvider(new PieChartViewProvider(openmct));

    openmct.inspectorViews.addProvider(new PieChartInspectorViewProvider(openmct));

    openmct.composition.addPolicy(new PieChartCompositionPolicy(openmct).allow);
  };
}
