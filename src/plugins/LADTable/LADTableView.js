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

import LadTable from './components/LADTable.vue';
import LADTableConfiguration from './LADTableConfiguration';

export default class LADTableView {
  constructor(openmct, domainObject, objectPath) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.objectPath = objectPath;
    this.component = null;
    this._destroy = null;
  }

  show(element) {
    let ladTableConfiguration = new LADTableConfiguration(this.domainObject, this.openmct);

    const { vNode, destroy } = mount(
      {
        el: element,
        components: {
          LadTable
        },
        provide: {
          openmct: this.openmct,
          currentView: this,
          ladTableConfiguration
        },
        data: () => {
          return {
            domainObject: this.domainObject,
            objectPath: this.objectPath
          };
        },
        template:
          '<lad-table ref="ladTable" :domain-object="domainObject" :object-path="objectPath"></lad-table>'
      },
      {
        app: this.openmct.app,
        element
      }
    );
    this.component = vNode.componentInstance;
    this._destroy = destroy;
  }

  getViewContext() {
    if (!this.component) {
      return {};
    }

    return this.component.$refs.ladTable.getViewContext();
  }

  destroy() {
    if (this._destroy) {
      this._destroy();
    }
  }
}
