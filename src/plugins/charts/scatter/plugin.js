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

import ScatterPlotInspectorViewProvider from './inspector/ScatterPlotInspectorViewProvider';
import ScatterPlotCompositionPolicy from './ScatterPlotCompositionPolicy';
import { SCATTER_PLOT_KEY } from './scatterPlotConstants.js';
import ScatterPlotForm from './ScatterPlotForm.vue';
import ScatterPlotViewProvider from './ScatterPlotViewProvider';

export default function () {
  return function install(openmct) {
    openmct.forms.addNewFormControl(
      'scatter-plot-form-control',
      getScatterPlotFormControl(openmct)
    );

    openmct.types.addType(SCATTER_PLOT_KEY, {
      key: SCATTER_PLOT_KEY,
      name: 'Scatter Plot',
      cssClass: 'icon-plot-scatter',
      description: 'View data as a scatter plot.',
      creatable: true,
      initialize: function (domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          styles: {},
          axes: {},
          ranges: {}
        };
      },
      form: [
        {
          name: 'Underlay data (JSON file)',
          key: 'selectFile',
          control: 'file-input',
          text: 'Select File...',
          type: 'application/json',
          removable: true,
          hideFromInspector: true,
          property: ['selectFile']
        },
        {
          name: 'Underlay ranges',
          control: 'scatter-plot-form-control',
          cssClass: 'l-input',
          key: 'scatterPlotForm',
          required: false,
          hideFromInspector: false,
          property: ['configuration', 'ranges'],
          validate: ({ value }, callback) => {
            const { rangeMin, rangeMax, domainMin, domainMax } = value;
            const valid = {
              rangeMin,
              rangeMax,
              domainMin,
              domainMax
            };

            if (callback) {
              callback(valid);
            }

            const values = Object.values(valid);
            const hasAllValues = values.every((rangeValue) => rangeValue !== undefined);
            const hasNoValues = values.every((rangeValue) => rangeValue === undefined);

            return hasAllValues || hasNoValues;
          }
        }
      ],
      priority: 891
    });

    openmct.objectViews.addProvider(new ScatterPlotViewProvider(openmct));

    openmct.inspectorViews.addProvider(new ScatterPlotInspectorViewProvider(openmct));

    openmct.composition.addPolicy(new ScatterPlotCompositionPolicy(openmct).allow);
  };

  function getScatterPlotFormControl(openmct) {
    let destroyComponent;

    return {
      show(element, model, onChange) {
        const { vNode, destroy } = mount(
          {
            el: element,
            components: {
              ScatterPlotForm
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
            template: `<scatter-plot-form :model="model" @onChange="onChange"></scatter-plot-form>`
          },
          {
            app: openmct.app,
            element
          }
        );
        destroyComponent = destroy;

        return vNode;
      },
      destroy() {
        destroyComponent();
      }
    };
  }
}
