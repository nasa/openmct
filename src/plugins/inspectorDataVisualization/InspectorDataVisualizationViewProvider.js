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

import InspectorDataVisualizationComponent from './InspectorDataVisualizationComponent.vue';

export default function InspectorDataVisualizationViewProvider(openmct, configuration) {
  const {
    type = 'mmgis',
    name = 'Data Visualization',
    placeholderText = '',
    plotOptions,
    imageryOptions
  } = configuration;

  return {
    key: 'inspectorDataVisualizationView',
    name,

    canView(selection) {
      const domainObject = selection?.[0]?.[0]?.context?.item;

      return domainObject?.type === type;
    },

    view(selection) {
      let _destroy = null;

      const context = selection[0][0].context;
      const domainObject = context.item;
      const dataVisualizationContext = context?.dataVisualization ?? {};
      const timeFormatter = openmct.telemetry.getFormatter('iso');

      return {
        show(element) {
          const { destroy } = mount(
            {
              components: {
                InspectorDataVisualization: InspectorDataVisualizationComponent
              },
              provide: {
                openmct,
                domainObject,
                timeFormatter,
                placeholderText,
                plotOptions,
                imageryOptions
              },
              data() {
                return {
                  context: dataVisualizationContext
                };
              },
              template: `<InspectorDataVisualization :context="context" />`
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
        },
        destroy() {
          if (_destroy) {
            _destroy();
          }
        },
        priority() {
          return openmct.priority.HIGH;
        }
      };
    }
  };
}
