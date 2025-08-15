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

import GridViewComponent from './components/GridView.vue';
import { ALLOWED_FOLDER_TYPES } from './constants.js';

export default class FolderGridView {
  constructor(openmct) {
    this.openmct = openmct;
    this.key = 'grid';
    this.name = 'Grid View';
    this.cssClass = 'icon-thumbs-strip';
  }
  canView(domainObject) {
    return ALLOWED_FOLDER_TYPES.includes(domainObject.type);
  }

  view(domainObject) {
    return {
      show: (element) => {
        const { destroy } = mount(
          {
            components: {
              GridViewComponent
            },
            provide: {
              openmct: this.openmct,
              domainObject
            },
            template: '<GridViewComponent></GridViewComponent>'
          },
          {
            app: this.openmct.app,
            element
          }
        );
        this._destroy = destroy;
      },
      destroy: () => {
        if (this._destroy) {
          this._destroy();
        }
      }
    };
  }

  priority() {
    return 1;
  }
}
