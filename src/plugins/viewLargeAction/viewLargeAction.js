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

import PreviewContainer from '@/ui/preview/PreviewContainer.vue';

const VIEW_LARGE_ACTION_KEY = 'large.view';

class ViewLargeAction {
  constructor(openmct) {
    this.openmct = openmct;

    this.cssClass = 'icon-items-expand';
    this.description = 'View Large';
    this.group = 'windowing';
    this.key = VIEW_LARGE_ACTION_KEY;
    this.name = 'Large View';
    this.priority = 1;
    this.showInStatusBar = true;
    this.destroy = null;
    this.preview = null;
  }

  invoke(objectPath, view) {
    performance.mark('viewlarge.start');
    const childElement = view?.parentElement?.firstElementChild;
    if (!childElement) {
      const message = 'ViewLargeAction: missing element';
      this.openmct.notifications.error(message);
      throw new Error(message);
    }

    this._expand(objectPath, view);
  }

  appliesTo(objectPath, view) {
    const childElement = view?.parentElement?.firstElementChild;

    return (
      childElement &&
      !childElement?.classList?.contains('js-main-container') &&
      !this.openmct.router.isNavigatedObject(objectPath)
    );
  }

  _expand(objectPath, view) {
    const element = this._getPreview(objectPath, view);
    view.onPreviewModeChange?.({ isPreviewing: true });

    this.overlay = this.openmct.overlays.overlay({
      element,
      size: 'large',
      autoHide: false,
      onDestroy: () => {
        this.destroy();
        this.preview = null;
        view.onPreviewModeChange?.();
      }
    });
  }

  _getPreview(objectPath, view) {
    const { vNode, destroy } = mount(
      {
        components: {
          PreviewContainer
        },
        provide: {
          openmct: this.openmct,
          objectPath
        },
        data() {
          return {
            view
          };
        },
        template: '<preview-container :existing-view="view"></preview-container>'
      },
      {
        app: this.openmct.app
      }
    );
    this.preview = vNode.componentInstance;
    this.destroy = () => {
      destroy();
      this.preview = null;
    };

    return this.preview.$el;
  }
}

export { VIEW_LARGE_ACTION_KEY };

export default ViewLargeAction;
