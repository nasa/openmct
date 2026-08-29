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

import OverlayComponent from './components/OverlayComponent.vue';

const cssClasses = {
  large: 'l-overlay-large',
  small: 'l-overlay-small',
  fit: 'l-overlay-fit',
  fullscreen: 'l-overlay-fullscreen',
  dialog: 'l-overlay-dialog'
};

class Overlay extends EventEmitter {
  constructor({
    buttons,
    autoHide = true,
    dismissible = true,
    element,
    onDestroy,
    onDismiss,
    size
  } = {}) {
    super();

    this.container = document.createElement('div');
    this.container.classList.add('l-overlay-wrapper', cssClasses[size]);

    this.autoHide = autoHide;
    this.dismissible = dismissible !== false;

    const { destroy } = mount(
      {
        components: {
          OverlayComponent
        },
        provide: {
          dismiss: this.notifyAndDismiss.bind(this),
          element,
          buttons,
          dismissible: this.dismissible
        },
        template: '<overlay-component></overlay-component>'
      },
      {
        element: this.container
      }
    );

    this.destroy = destroy;

    if (onDestroy) {
      this.once('destroy', onDestroy);
    }

    if (onDismiss) {
      this.once('dismiss', onDismiss);
    }
  }

  dismiss() {
    this.emit('destroy');
    this.destroy();
    this.container.remove();
  }

  //Ensures that any callers are notified that the overlay is dismissed
  notifyAndDismiss() {
    this.emit('dismiss');
    this.dismiss();
  }

  /**
   * @private
   **/
  show() {
    document.body.appendChild(this.container);
  }
}

export default Overlay;
