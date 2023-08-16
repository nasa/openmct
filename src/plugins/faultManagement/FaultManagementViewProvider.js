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

import FaultManagementView from './FaultManagementView.vue';
import { FAULT_MANAGEMENT_TYPE, FAULT_MANAGEMENT_VIEW } from './constants';
import mount from 'utils/mount';

export default class FaultManagementViewProvider {
  constructor(openmct) {
    this.openmct = openmct;
    this.key = FAULT_MANAGEMENT_VIEW;
  }

  canView(domainObject) {
    return domainObject.type === FAULT_MANAGEMENT_TYPE;
  }

  canEdit(domainObject) {
    return false;
  }

  view(domainObject) {
    const openmct = this.openmct;
    let _destroy = null;

    return {
      show: (element) => {
        const { destroy } = mount(
          {
            el: element,
            components: {
              FaultManagementView
            },
            provide: {
              openmct,
              domainObject
            },
            template: '<FaultManagementView></FaultManagementView>'
          },
          {
            app: openmct.app,
            element
          }
        );
        _destroy = destroy;
      },
      destroy: () => {
        if (_destroy) {
          _destroy();
        }
      }
    };
  }
}
