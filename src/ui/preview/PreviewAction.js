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
import { EventEmitter } from 'eventemitter3';
import mount from 'utils/mount';

import PreviewContainer from './PreviewContainer.vue';

const PREVIEW_ACTION_KEY = 'preview';

class PreviewAction extends EventEmitter {
  constructor(openmct) {
    super();
    /**
     * Metadata
     */
    this.name = 'View';
    this.key = PREVIEW_ACTION_KEY;
    this.description = 'View in large dialog';
    this.cssClass = 'icon-items-expand';
    this.group = 'windowing';
    this.priority = 1;

    /**
     * Dependencies
     */
    this._openmct = openmct;

    if (PreviewAction.isVisible === undefined) {
      PreviewAction.isVisible = false;
    }
  }

  invoke(objectPath, viewOptions) {
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
            viewOptions
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
        PreviewAction.isVisible = false;
        destroy();
        this.emit('isVisible', false);
        overlay.dismiss();
      }
    });

    PreviewAction.isVisible = true;
    this.emit('isVisible', true);
  }

  appliesTo(objectPath, view = {}) {
    const parentElement = view.parentElement;
    const isObjectView = parentElement && parentElement.classList.contains('js-object-view');

    return (
      !PreviewAction.isVisible &&
      !this._openmct.router.isNavigatedObject(objectPath) &&
      !isObjectView
    );
  }

  _preventPreview(objectPath) {
    const noPreviewTypes = ['folder'];

    return noPreviewTypes.includes(objectPath[0].type);
  }
}

export { PREVIEW_ACTION_KEY };

export default PreviewAction;
