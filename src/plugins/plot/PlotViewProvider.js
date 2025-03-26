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

import Plot from './PlotView.vue';

export default function PlotViewProvider(openmct) {
  function hasNumericTelemetry(domainObject) {
    if (!Object.prototype.hasOwnProperty.call(domainObject, 'telemetry')) {
      return false;
    }

    let metadata = openmct.telemetry.getMetadata(domainObject);

    return metadata.values().length > 0 && hasDomainAndNumericRange(metadata);
  }

  function hasDomainAndNumericRange(metadata) {
    const rangeValues = metadata.valuesForHints(['range']);
    const domains = metadata.valuesForHints(['domain']);

    return (
      domains.length > 0 &&
      rangeValues.length > 0 &&
      !rangeValues.every((value) => value.format === 'string')
    );
  }

  function isCompactView(objectPath) {
    let isChildOfTimeStrip = objectPath.find((object) => object.type === 'time-strip');

    return isChildOfTimeStrip && !openmct.router.isNavigatedObject(objectPath);
  }

  return {
    key: 'plot-single',
    name: 'Plot',
    cssClass: 'icon-telemetry',
    canView(domainObject, objectPath) {
      return hasNumericTelemetry(domainObject);
    },

    view: function (domainObject, objectPath) {
      let _destroy = null;
      let component = null;

      return {
        show: function (element, isEditing, { renderWhenVisible }) {
          let isCompact = isCompactView(objectPath);
          const { vNode, destroy } = mount(
            {
              el: element,
              components: {
                Plot
              },
              provide: {
                openmct,
                domainObject,
                objectPath,
                renderWhenVisible
              },
              data() {
                return {
                  options: {
                    compact: isCompact
                  }
                };
              },
              template: '<plot ref="plotComponent" :options="options"></plot>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
          component = vNode.componentInstance;
        },
        getViewContext() {
          if (!component) {
            return {};
          }

          return component.$refs.plotComponent.getViewContext();
        },
        destroy: function () {
          if (_destroy) {
            _destroy();
          }
        },
        getComponent() {
          return component;
        }
      };
    }
  };
}
