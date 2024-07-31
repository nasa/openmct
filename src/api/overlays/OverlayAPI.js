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
   * Shows an overlay
   * @private
   * @param {Overlay} overlay - The overlay to show
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
   * Dismisses the last overlay
   * @private
   */
  dismissLastOverlay() {
    let lastOverlay = this.activeOverlays[this.activeOverlays.length - 1];
    if (lastOverlay && lastOverlay.dismissible) {
      lastOverlay.notifyAndDismiss();
    }
  }

  /**
   * Creates and displays an overlay with the specified options.
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
   * displaying messages that require the user's immediate attention.
   * @param {DialogOptions} options - Defines options for the dialog
   * @returns {Dialog} An object with a dismiss function that can be called from the calling code to dismiss/destroy the dialog
   */
  dialog(options) {
    let dialog = new Dialog(options);

    this.showOverlay(dialog);

    return dialog;
  }

  /**
   * Displays a blocking (modal) progress dialog. This dialog can be used for
   * displaying messages that require the user's attention, and show progress
   * @param {ProgressDialogOptions} options - Defines options for the dialog
   * @returns {ProgressDialog} An object with a dismiss function that can be called from the calling code
   * to dismiss/destroy the dialog and an updateProgress function that takes progressPercentage(Number 0-100)
   * and progressText (string)
   */
  progressDialog(options) {
    let progressDialog = new ProgressDialog(options);

    this.showOverlay(progressDialog);

    return progressDialog;
  }

  /**
   * Creates and displays a selection overlay
   * @param {SelectionOptions} options - The options for the selection overlay
   * @returns {Selection} The created Selection instance
   */
  selection(options) {
    let selection = new Selection(options);
    this.showOverlay(selection);

    return selection;
  }
}

export default OverlayAPI;

/**
 * @typedef {Object} OverlayOptions
 * @property {HTMLElement} element - The DOM Element to be inserted or shown in the overlay.
 * @property {'large'|'small'|'fit'} size - The preferred size of the overlay.
 * @property {Array<{label: string, callback: Function}>} [buttons] - Optional array of button objects, each with 'label' and 'callback' properties.
 * @property {Function} onDestroy - Callback to be called when the overlay is destroyed.
 * @property {boolean} [dismissible=true] - Whether the overlay can be dismissed by pressing 'esc' or clicking outside of it. Defaults to true.
 */

/**
 * @typedef {Object} DialogOptions
 * @property {string} title - The title to use for the dialog
 * @property {string} iconClass - Class to apply to icon that is shown on dialog
 * @property {string} message - Text that indicates a current message
 * @property {Array<{label: string, callback: Function}>} buttons - A list of buttons with label and callback properties that will be added to the dialog.
 */

/**
 * @typedef {Object} ProgressDialogOptions
 * @property {number | null} progressPerc - The initial progress value (0-100) or null for anonymous progress
 * @property {string} progressText - The initial text to be shown under the progress bar
 * @property {Array<{label: string, callback: Function}>} buttons - A list of buttons with label and callback properties that will be added to the dialog.
 */

/**
 * @typedef {Object} SelectionOptions
 * @property {any} options - The options for the selection overlay
 */
