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

import { BAR_GRAPH_KEY, BAR_GRAPH_VIEW } from './BarGraphConstants';
import BarGraphView from './BarGraphView.vue';

export default function BarGraphViewProvider(openmct) {
  function isCompactView(objectPath) {
    let isChildOfTimeStrip = objectPath.find((object) => object.type === 'time-strip');

    return isChildOfTimeStrip && !openmct.router.isNavigatedObject(objectPath);
  }

  return {
    key: BAR_GRAPH_VIEW,
    name: 'Bar Graph',
    cssClass: 'icon-telemetry',
    canView(domainObject, objectPath) {
      return domainObject && domainObject.type === BAR_GRAPH_KEY;
    },

    canEdit(domainObject, objectPath) {
      return domainObject && domainObject.type === BAR_GRAPH_KEY;
    },

    view(domainObject, objectPath) {
      let _destroy = null;
      let component = null;

      return {
        show(element) {
          let isCompact = isCompactView(objectPath);

          const { vNode, destroy } = mount(
            {
              components: {
                BarGraphView
              },
              provide: {
                openmct,
                domainObject,
                path: objectPath
              },
              data() {
                return {
                  options: {
                    compact: isCompact
                  }
                };
              },
              template: '<bar-graph-view ref="graphComponent" :options="options"></bar-graph-view>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
          component = vNode.componentInstance;
        },
        destroy() {
          _destroy();
        },
        onClearData() {
          component.$refs.graphComponent.refreshData();
        }
      };
    }
  };
}
