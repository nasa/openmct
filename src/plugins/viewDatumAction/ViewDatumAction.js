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

import MetadataListView from './components/MetadataList.vue';
import mount from 'utils/mount';

export default class ViewDatumAction {
  constructor(openmct) {
    this.name = 'View Full Datum';
    this.key = 'viewDatumAction';
    this.description = 'View full value of datum received';
    this.cssClass = 'icon-object';

    this.openmct = openmct;
  }
  invoke(objectPath, view) {
    let viewContext = view.getViewContext && view.getViewContext();
    const row = viewContext.row;
    let attributes = row.getDatum && row.getDatum();
    const { vNode, destroy } = mount(
      {
        components: {
          MetadataListView
        },
        provide: {
          name: this.name,
          attributes
        },
        template: '<MetadataListView />'
      },
      {
        app: this.openmct.app
      }
    );

    this.openmct.overlays.overlay({
      element: vNode.el,
      size: 'large',
      dismissable: true,
      onDestroy: destroy
    });
  }
  appliesTo(objectPath, view = {}) {
    let viewContext = (view.getViewContext && view.getViewContext()) || {};
    const row = viewContext.row;
    if (!row) {
      return false;
    }

    let datum = row.getDatum;
    let enabled = row.viewDatumAction;
    if (enabled && datum) {
      return true;
    }

    return false;
  }
}
