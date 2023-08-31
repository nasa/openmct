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

import FlexibleLayoutComponent from './components/flexibleLayout.vue';

const FLEXIBLE_LAYOUT_KEY = 'flexible-layout';
export default class FlexibleLayoutViewProvider {
  constructor(openmct) {
    this.openmct = openmct;
    this.key = FLEXIBLE_LAYOUT_KEY;
    this.name = 'Flexible Layout';
    this.cssClass = 'icon-layout-view';
    this.destroy = null;
  }

  canView(domainObject) {
    return domainObject.type === FLEXIBLE_LAYOUT_KEY;
  }

  canEdit(domainObject) {
    return domainObject.type === FLEXIBLE_LAYOUT_KEY;
  }

  view(domainObject, objectPath) {
    let openmct = this.openmct;
    let _destroy = null;
    let component = null;

    return {
      show(element, isEditing) {
        const { vNode, destroy } = mount(
          {
            components: {
              FlexibleLayoutComponent
            },
            provide: {
              openmct,
              objectPath,
              domainObject
            },
            data() {
              return {
                isEditing: isEditing
              };
            },
            template:
              '<flexible-layout-component ref="flexibleLayout" :isEditing="isEditing"></flexible-layout-component>'
          },
          {
            app: openmct.app,
            element
          }
        );
        component = vNode.componentInstance;
        _destroy = destroy;
      },
      getSelectionContext() {
        return {
          item: domainObject,
          addContainer: component.$refs.flexibleLayout.addContainer,
          deleteContainer: component.$refs.flexibleLayout.deleteContainer,
          deleteFrame: component.$refs.flexibleLayout.deleteFrame,
          type: 'flexible-layout'
        };
      },
      onEditModeChange(isEditing) {
        component.isEditing = isEditing;
      },
      destroy() {
        if (_destroy) {
          _destroy();
          component = null;
        }
      }
    };
  }
  priority() {
    return 1;
  }
}
