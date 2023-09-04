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

import TabsComponent from './components/tabs.vue';

const TABS_KEY = 'tabs';
export default class Tabs {
  constructor(openmct) {
    this.openmct = openmct;
    this.key = TABS_KEY;
    this.name = 'Tabs';
    this.cssClass = 'icon-list-view';
    this.destroy = null;
  }

  canView(domainObject) {
    return domainObject.type === TABS_KEY;
  }

  canEdit(domainObject) {
    return domainObject.type === TABS_KEY;
  }

  view(domainObject, objectPath) {
    let openmct = this.openmct;
    let component = null;

    return {
      show: function (element, editMode) {
        const { vNode, destroy } = mount(
          {
            el: element,
            components: {
              TabsComponent
            },
            provide: {
              openmct,
              domainObject,
              objectPath,
              composition: openmct.composition.get(domainObject)
            },
            data() {
              return {
                isEditing: editMode
              };
            },
            template: '<tabs-component :isEditing="isEditing"></tabs-component>'
          },
          {
            app: openmct.app,
            element
          }
        );
        this.destroy = destroy;
        component = vNode.componentInstance;
      },
      onEditModeChange(editMode) {
        component.isEditing = editMode;
      },
      destroy: function (element) {
        if (this.destroy) {
          this.destroy();
        }
      }
    };
  }

  priority() {
    return 1;
  }
}
