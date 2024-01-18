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

import Dialog from './Dialog.js';
import Overlay from './Overlay.js';
import ProgressDialog from './ProgressDialog.js';
import Selection from './Selection.js';

/**
 * The OverlayAPI is responsible for pre-pending templates to
 * the body of the document, which is useful for displaying templates
 * which need to block the full screen.
 *
 * @memberof api/overlays
 * @constructor
 */

class OverlayAPI {
  constructor() {
    this.activeOverlays = [];

    this.dismissLastOverlay = this.dismissLastOverlay.bind(this);

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.dismissLastOverlay();
      }
    });
  }

  /**
   * private
   */
  showOverlay(overlay) {
    if (this.activeOverlays.length) {
      const previousOverlay = this.activeOverlays[this.activeOverlays.length - 1];
      if (previousOverlay.autoHide) {
        previousOverlay.container.classList.add('invisible');
      }
    }

    this.activeOverlays.push(overlay);

    overlay.once('destroy', () => {
      this.activeOverlays.splice(this.activeOverlays.indexOf(overlay), 1);

      if (this.activeOverlays.length) {
        this.activeOverlays[this.activeOverlays.length - 1].container.classList.remove('invisible');
      }
    });

    overlay.show();
  }

  /**
   * private
   */
  dismissLastOverlay() {
    let lastOverlay = this.activeOverlays[this.activeOverlays.length - 1];
    if (lastOverlay && lastOverlay.dismissable) {
      lastOverlay.notifyAndDismiss();
    }
  }

  /**
   * Creates and displays an overlay with the specified options.
   *
   * @typedef {Object} OverlayOptions
   * @property {HTMLElement} element The DOM Element to be inserted or shown in the overlay.
   * @property {'large'|'small'|'fit'} size The preferred size of the overlay.
   * @property {Array<{label: string, callback: Function}>} [buttons] Optional array of button objects, each with 'label' and 'callback' properties.
   * @property {Function} onDestroy Callback to be called when the overlay is destroyed.
   * @property {boolean} [dismissable=true] Whether the overlay can be dismissed by pressing 'esc' or clicking outside of it. Defaults to true.
   *
   * @param {OverlayOptions} options - The configuration options for the overlay.
   * @returns {Overlay} An instance of the Overlay class.
   */
  overlay(options) {
    let overlay = new Overlay(options);

    this.showOverlay(overlay);

    return overlay;
  }

  /**
   * Displays a blocking (modal) dialog. This dialog can be used for
   * displaying messages that require the user's
   * immediate attention.
   * @param {model} options defines options for the dialog
   * @returns {object} with an object with a dismiss function that can be called from the calling code
   * to dismiss/destroy the dialog
   *
   * A description of the model options that may be passed to the
   * dialog method. Note that the DialogModel described
   * here is shared with the Notifications framework.
   * @see NotificationService
   *
   * @typedef options
   * @property {string} title the title to use for the dialog
   * @property {string} iconClass class to apply to icon that is shown on dialog
   * @property {string} message text that indicates a current message,
   * @property {buttons[]} buttons a list of buttons with title and callback properties that will
   * be added to the dialog.
   */
  dialog(options) {
    let dialog = new Dialog(options);

    this.showOverlay(dialog);

    return dialog;
  }

  /**
   * Displays a blocking (modal) progress dialog. This dialog can be used for
   * displaying messages that require the user's attention, and show progress
   * @param {model} options defines options for the dialog
   * @returns {object} with an object with a dismiss function that can be called from the calling code
   * to dismiss/destroy the dialog and an updateProgress function that takes progressPercentage(Number 0-100)
   * and progressText (string)
   *
   * A description of the model options that may be passed to the
   * dialog method. Note that the DialogModel described
   * here is shared with the Notifications framework.
   * @see NotificationService
   *
   * @typedef options
   * @property {number | null} progressPerc the initial progress value (0-100) or null for anonymous progress
   * @property {string} progressText the initial text to be shown under the progress bar
   * @property {buttons[]} buttons a list of buttons with title and callback properties that will
   * be added to the dialog.
   */
  progressDialog(options) {
    let progressDialog = new ProgressDialog(options);

    this.showOverlay(progressDialog);

    return progressDialog;
  }

  selection(options) {
    let selection = new Selection(options);
    this.showOverlay(selection);

    return selection;
  }
}

export default OverlayAPI;
