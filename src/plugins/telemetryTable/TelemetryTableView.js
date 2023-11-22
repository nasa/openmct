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

import TableComponent from './components/TableComponent.vue';
import TelemetryTable from './TelemetryTable';

export default class TelemetryTableView {
  constructor(openmct, domainObject, objectPath) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.objectPath = objectPath;
    this._destroy = null;
    this.component = null;

    Object.defineProperty(this, 'table', {
      value: new TelemetryTable(domainObject, openmct),
      enumerable: false,
      configurable: false
    });
  }

  getViewContext() {
    if (!this.component) {
      return {};
    }

    return this.component.$refs.tableComponent.getViewContext();
  }

  onEditModeChange(editMode) {
    this.component.isEditing = editMode;
  }

  onClearData() {
    this.table.clearData();
  }

  getTable() {
    return this.table;
  }

  destroy() {
    if (this._destroy) {
      this._destroy();
    }
  }

  show(element, editMode, { renderWhenVisible }) {
    const { vNode, destroy } = mount(
      {
        el: element,
        components: {
          TableComponent
        },
        provide: {
          openmct: this.openmct,
          objectPath: this.objectPath,
          table: this.table,
          currentView: this,
          renderWhenVisible
        },
        data() {
          return {
            isEditing: editMode,
            marking: {
              disableMultiSelect: false,
              enable: true,
              rowName: '',
              rowNamePlural: '',
              useAlternateControlBar: false
            }
          };
        },
        template:
          '<table-component ref="tableComponent" :is-editing="isEditing" :marking="marking"></table-component>'
      },
      {
        app: this.openmct.app,
        element
      }
    );
    this.component = vNode.componentInstance;
    this._destroy = destroy;
  }
}
