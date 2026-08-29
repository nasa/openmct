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

import ProgressDialogComponent from './components/ProgressDialogComponent.vue';
import Overlay from './Overlay.js';

let component;
class ProgressDialog extends Overlay {
  constructor({
    progressPerc,
    progressText,
    iconClass,
    message,
    title,
    hint,
    timestamp,
    ...options
  }) {
    const { vNode, destroy } = mount({
      components: {
        ProgressDialogComponent
      },
      provide: {
        iconClass,
        message,
        title,
        hint,
        timestamp
      },
      data() {
        return {
          progressPerc,
          progressText
        };
      },
      template:
        '<progress-dialog-component :progress-perc="progressPerc" :progress-text="progressText"></progress-dialog-component>'
    });

    component = vNode.componentInstance;
    super({
      element: vNode.el,
      size: 'fit',
      dismissible: false,
      ...options
    });

    this.once('destroy', () => {
      destroy();
    });
  }

  updateProgress(progressPerc, progressText) {
    component.$data.progressPerc = progressPerc;
    component.$data.progressText = progressText;
  }
}

export default ProgressDialog;
