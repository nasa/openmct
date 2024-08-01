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

import CompsView from './components/CompsView.vue';

const DEFAULT_VIEW_PRIORITY = 100;

export default class ConditionSetViewProvider {
  constructor(openmct, compsManagerPool) {
    this.openmct = openmct;
    this.name = 'Comps View';
    this.key = 'comps.view';
    this.cssClass = 'icon-telemetry';
    this.compsManagerPool = compsManagerPool;
  }

  canView(domainObject, objectPath) {
    return domainObject.type === 'comps' && this.openmct.router.isNavigatedObject(objectPath);
  }

  canEdit(domainObject, objectPath) {
    return domainObject.type === 'comps' && this.openmct.router.isNavigatedObject(objectPath);
  }

  view(domainObject, objectPath) {
    let _destroy = null;
    let component = null;

    return {
      show: (container, isEditing) => {
        const { vNode, destroy } = mount(
          {
            el: container,
            components: {
              CompsView
            },
            provide: {
              openmct: this.openmct,
              domainObject,
              objectPath,
              compsManagerPool: this.compsManagerPool
            },
            data() {
              return {
                isEditing
              };
            },
            template: '<CompsView :isEditing="isEditing"></CompsView>'
          },
          {
            app: this.openmct.app,
            element: container
          }
        );
        _destroy = destroy;
        component = vNode.componentInstance;
      },
      onEditModeChange: (isEditing) => {
        component.isEditing = isEditing;
      },
      destroy: () => {
        if (_destroy) {
          _destroy();
        }
        component = null;
      }
    };
  }

  priority(domainObject) {
    if (domainObject.type === 'comps') {
      return Number.MAX_VALUE;
    } else {
      return DEFAULT_VIEW_PRIORITY;
    }
  }
}
