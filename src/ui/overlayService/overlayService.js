/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    './overlay.vue',
    './blockingMessage.vue',
    'vue'
], function (
    OverlayComponent,
    BlockingMessage,
    Vue
) {

    /**
     * The OverlayService is responsible for pre-pending templates to
     * the body of the document, which is useful for displaying templates
     * which need to block the full screen.
     *
     * @memberof platform/ui/overlayService
     * @constructor
    */

    function OverlayService() {
        this.activeOverlays = [];
        this.overlayId = 0;

        this.showBlockingMessage = this.showBlockingMessage.bind(this);
    }

    /**
     * A description of option properties that can be passed into the overlay
    * @typedef options
        * @property {string} cssClass class to be applied to overlay.
        * supported classes are - l-large-view, l-dialog, l-message
        * @property {array} buttons optional button objects with label and callback properties
        * @property {function} onDestroy callback to be called when overlay is destroyed
        * (useful for clearing out listeners and destroying components)
    */

    /**
     * Add a new overlay to the document. This will be
     * prepended to the document body
     *
     * @param {object} element a DOM element, that needs to be inserted into the Overlay
     * @param {object} options
     * @returns {object} with a dismiss function that can be called to dimiss/destroy the overlay from
     * the calling code.
     */
    OverlayService.prototype.show  = function (element, options) {
        if(this.activeOverlays.length) {
            this.activeOverlays[this.activeOverlays.length - 1].overlay.classList.add('invisible');
        }

        let overlayTypeCssClass = options.cssClass, // Values could be l-large-view, l-dialog, l-message
            overlay = document.createElement('div'),
            component = new Vue({
                provide: {
                    destroy: this.destroy.bind(this),
                    element: element,
                    buttons: options.buttons
                },
                components: {
                    OverlayComponent: OverlayComponent.default
                },
                template: '<overlay-component></overlay-component>'
            }),
            dialog = {};


        overlay.classList.add('l-overlay-wrapper', overlayTypeCssClass);
        document.body.appendChild(overlay);

        overlay.appendChild(component.$mount().$el);

        var overlayObject = {
            overlay: overlay,
            component: component,
            onDestroy: options.onDestroy,
            id: this.overlayId,
            dialog: dialog
        };

        dialog.dismiss = function () {
            let pos = findInArray(overlayObject.id, this.activeOverlays);

            if (pos !== -1) {
                if (overlayObject.onDestroy && typeof overlayObject.onDestroy === 'function') {
                    overlayObject.onDestroy();
                }

                overlayObject.component.$destroy(true);
                document.body.removeChild(overlayObject.overlay);
                this.activeOverlays.splice(pos, 1);

                if (this.activeOverlays.length) {
                    this.activeOverlays[this.activeOverlays.length - 1].overlay.classList.remove('invisible');
                }
            }
        }.bind(this);

        this.activeOverlays.push(overlayObject);
        this.overlayId++;

        return dialog;
    };

    OverlayService.prototype.destroy = function () {
        var lastActiveOverlayObject = this.activeOverlays[this.activeOverlays.length - 1];

        lastActiveOverlayObject.dialog.dismiss();
    };

    /**
     * A description of the model options that may be passed to the
     * showBlockingMessage method. Note that the DialogModel described
     * here is shared with the Notifications framework.
     * @see NotificationService
     *
    * @typedef model
        * @property {string} title the title to use for the dialog
        * @property {string} severity the severity level of this message.
        * These are defined in a bundle constant with key 'dialogSeverity'
        * @property {string} hint the 'hint' message to show below the title
        * @property {string} actionText text that indicates a current action,
        * shown above a progress bar to indicate what's happening.
        * @property {number} progress a percentage value (1-100)
        * indicating the completion of the blocking task
        * @property {string} progressText the message to show below a
        * progress bar to indicate progress. For example, this might be
        * used to indicate time remaining, or items still to process.
        * @property {boolean} unknownProgress some tasks may be
        * impossible to provide an estimate for. Providing a true value for
        * this attribute will indicate to the user that the progress and
        * duration cannot be estimated.
        * @property {Object} primaryOption an action that will
        * be added to the dialog as a button. The primary action can be
        * used as the suggested course of action for the user. Making it
        * distinct from other actions allows it to be styled differently,
        * and treated preferentially in banner mode.
        * @property {buttons[]} buttons a list of buttons with title and callback properties that will
        * be added to the dialog.
    */

    /**
     * Displays a blocking (modal) dialog. This dialog can be used for
     * displaying messages that require the user's
     * immediate attention. The message may include an indication of
     * progress, as well as a series of actions that
     * the user can take if necessary
     * @param {model} dialogModel defines options for the dialog
     * @returns {object} with a dismiss function that can be called from the calling code
     * to dismiss/destroy the dialog
    */
    OverlayService.prototype.showBlockingMessage = function (model) {
        let component = new Vue({
            provide: {
                model: model
            },
            components: {
                BlockingMessage: BlockingMessage.default
            },
            template: '<blocking-message></blocking-message>'
        });

        function destroy() {
            component.$destroy(true);
        }

        let options = {
            cssClass: 'l-message',
            onDestroy: destroy,
            buttons: model.buttons
        };

        return this.show(component.$mount().$el, options);
    };

    function findInArray(id, array) {
        var found = -1;

        array.forEach(function (o,i) {
            if (o.id === id) {
                found = i;
                return;
            }
        });

        return found;
    }

    return OverlayService;
});
