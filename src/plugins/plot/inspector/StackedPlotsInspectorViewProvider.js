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
import mount from 'utils/mount';

import PlotOptions from './PlotOptions.vue';

export default function StackedPlotsInspectorViewProvider(openmct) {
  return {
    key: 'stacked-plots-inspector',
    name: 'Config',
    canView: function (selection) {
      if (selection.length === 0 || selection[0].length === 0) {
        return false;
      }

      const object = selection[0][0].context.item;

      const isStackedPlotObject = object && object.type === 'telemetry.plot.stacked';

      return isStackedPlotObject;
    },
    view: function (selection) {
      let _destroy = null;
      let objectPath;

      if (selection.length) {
        objectPath = selection[0].map((selectionItem) => {
          return selectionItem.context.item;
        });
      }

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                PlotOptions: PlotOptions
              },
              provide: {
                openmct,
                domainObject: selection[0][0].context.item,
                path: objectPath
              },
              template: '<plot-options></plot-options>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
        },
        priority: function () {
          return openmct.editor.isEditing() ? openmct.priority.HIGH : openmct.priority.DEFAULT;
        },
        destroy: function () {
          if (_destroy) {
            _destroy();
          }
        }
      };
    }
  };
}
