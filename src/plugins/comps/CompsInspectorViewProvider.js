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

import CompsInspectorView from './components/CompsInspectorView.vue';

export default class ConditionSetViewProvider {
  constructor(openmct, compsManagerPool) {
    this.openmct = openmct;
    this.name = 'Config';
    this.key = 'comps-configuration';
    this.compsManagerPool = compsManagerPool;
  }

  canView(selection) {
    if (selection.length !== 1 || selection[0].length === 0) {
      return false;
    }

    let object = selection[0][0].context.item;
    return object && object.type === 'comps';
  }

  view(selection) {
    let _destroy = null;
    const domainObject = selection[0][0].context.item;
    const openmct = this.openmct;
    const compsManagerPool = this.compsManagerPool;

    return {
      show: function (element) {
        const { destroy } = mount(
          {
            el: element,
            components: {
              CompsInspectorView: CompsInspectorView
            },
            provide: {
              openmct,
              domainObject,
              compsManagerPool
            },
            template: '<comps-inspector-view></comps-inspector-view>'
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
      }
    };
  }
}
