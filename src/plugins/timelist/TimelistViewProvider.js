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

import { TIMELIST_TYPE } from './constants';
import Timelist from './Timelist.vue';

export default function TimelistViewProvider(openmct) {
  return {
    key: 'timelist.view',
    name: 'Time List',
    cssClass: 'icon-timelist',
    canView(domainObject) {
      return domainObject.type === TIMELIST_TYPE;
    },

    canEdit(domainObject) {
      return domainObject.type === TIMELIST_TYPE;
    },

    view: function (domainObject, objectPath) {
      let _destroy = null;

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                Timelist
              },
              provide: {
                openmct,
                domainObject,
                path: objectPath,
                composition: openmct.composition.get(domainObject)
              },
              template: '<timelist></timelist>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
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
