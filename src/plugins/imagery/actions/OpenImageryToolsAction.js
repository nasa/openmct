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

const OPEN_IMAGERY_TOOLS_ACTION_KEY = 'openImageryTools';
import PreviewContainer from '@/ui/preview/PreviewContainer.vue';

class OpenImageryToolsAction {
  constructor(openmct) {
    this.cssClass = 'icon-crosshair-in-circle';
    this.description = 'Open the Imagery Measurement Tool';
    this.group = 'action';
    this.key = OPEN_IMAGERY_TOOLS_ACTION_KEY;
    this.name = 'Open Imagery Tools';
    this.priority = 1;
    // Hook to check if we're launching the tool from an imagery view - sort of a hack?
    this.isVisible = false;

    /**
     * Dependencies
     */
    this._openmct = openmct;

    // Only one tool open at a time
    if (OpenImageryToolsAction.isVisible === undefined) {
      OpenImageryToolsAction.isVisible = false;
    }
  }

  invoke(objectPath, view) {
    const viewContext = view?.getViewContext?.() || {};
    const url = viewContext.imageUrl;
    // See ImageryToolsViewProvider.canView
    this.isOpen = true;

    const { vNode, destroy } = mount(
      {
        components: {
          PreviewContainer
        },
        provide: {
          openmct: this._openmct,
          objectPath: objectPath
        },
        data() {
          return {
            viewOptions: { viewImageUrl: url }
          };
        },
        template: '<preview-container :view-options="viewOptions"></preview-container>'
      },
      {
        app: this._openmct.app
      }
    );

    const overlay = this._openmct.overlays.overlay({
      element: vNode.el,
      size: 'large',
      autoHide: false,
      buttons: [
        {
          label: 'Done',
          callback: () => {
            overlay.dismiss();
          }
        }
      ],
      onDestroy: () => {
        OpenImageryToolsAction.isVisible = false;
        this.isVisible = false;
        destroy();
        overlay.dismiss();
      }
    });
    OpenImageryToolsAction.isVisible = true;
  }

  appliesTo(objectPath, view = {}) {
    const viewContext = (view.getViewContext && view.getViewContext()) || {};
    if (OpenImageryToolsAction.isVisible || !viewContext.imageUrl) {
      return false;
    }
    return true;
  }
}

export { OPEN_IMAGERY_TOOLS_ACTION_KEY };

export default OpenImageryToolsAction;
