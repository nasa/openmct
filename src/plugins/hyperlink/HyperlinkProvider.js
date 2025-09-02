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

import HyperlinkLayout from './HyperlinkLayout.vue';

export default function HyperlinkProvider(openmct) {
  return {
    key: 'hyperlink.view',
    name: 'Hyperlink',
    cssClass: 'icon-chain-links',
    canView(domainObject) {
      return domainObject.type === 'hyperlink';
    },

    view: function (domainObject) {
      let _destroy = null;

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                HyperlinkLayout
              },
              provide: {
                domainObject
              },
              template: '<hyperlink-layout></hyperlink-layout>'
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
