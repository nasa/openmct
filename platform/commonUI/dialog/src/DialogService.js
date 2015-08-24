/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

/**
 * This bundle implements the dialog service, which can be used to
 * launch dialogs for user input & notifications.
 * @namespace platform/commonUI/dialog
 */
define(
    [],
    function () {
        "use strict";
        /**
         * The dialog service is responsible for handling window-modal
         * communication with the user, such as displaying forms for user
         * input.
         * @memberof platform/commonUI/dialog
         * @constructor
         */
        function DialogService(overlayService, $q, $log) {
            this.overlayService = overlayService;
            this.$q = $q;
            this.$log = $log;
            this.overlay = undefined;
            this.dialogVisible = false;
        }

        // Stop showing whatever overlay is currently active
        // (e.g. because the user hit cancel)
        DialogService.prototype.dismiss = function () {
            var overlay = this.overlay;
            if (overlay) {
                overlay.dismiss();
            }
            this.dialogVisible = false;
        };

        DialogService.prototype.getDialogResponse = function (key, model, resultGetter) {
            // We will return this result as a promise, because user
            // input is asynchronous.
            var deferred = this.$q.defer(),
                self = this;

            // Confirm function; this will be passed in to the
            // overlay-dialog template and associated with a
            // OK button click
            function confirm(value) {
                // Pass along the result
                deferred.resolve(resultGetter ? resultGetter() : value);

                // Stop showing the dialog
                self.dismiss();
            }

            // Cancel function; this will be passed in to the
            // overlay-dialog template and associated with a
            // Cancel or X button click
            function cancel() {
                deferred.reject();
                self.dismiss();
            }

            // Add confirm/cancel callbacks
            model.confirm = confirm;
            model.cancel = cancel;

            if (this.dialogVisible) {
                // Only one dialog should be shown at a time.
                // The application design should be such that
                // we never even try to do this.
                this.$log.warn([
                    "Dialog already showing; ",
                    "unable to show ",
                    model.name
                ].join(""));
                deferred.reject();
            } else {
                // Add the overlay using the OverlayService, which
                // will handle actual insertion into the DOM
                this.overlay = this.overlayService.createOverlay(
                    key,
                    model
                );

                // Track that a dialog is already visible, to
                // avoid spawning multiple dialogs at once.
                this.dialogVisible = true;
            }

            return deferred.promise;
        };

        /**
         * Request user input via a window-modal dialog.
         *
         * @param {FormModel} formModel a description of the form
         *        to be shown (see platform/forms)
         * @param {object} value the initial state of the form
         * @returns {Promise} a promise for the form value that the
         *          user has supplied; this may be rejected if
         *          user input cannot be obtained (for instance,
         *          because the user cancelled the dialog)
         */
        DialogService.prototype.getUserInput = function (formModel, value) {
            var overlayModel = {
                title: formModel.name,
                message: formModel.message,
                structure: formModel,
                value: value
            };

            // Provide result from the model
            function resultGetter() {
                return overlayModel.value;
            }

            // Show the overlay-dialog
            return this.getDialogResponse(
                "overlay-dialog",
                overlayModel,
                resultGetter
            );
        };

        /**
         * Request that the user chooses from a set of options,
         * which will be shown as buttons.
         *
         * @param dialogModel a description of the dialog to show
         * @return {Promise} a promise for the user's choice
         */
        DialogService.prototype.getUserChoice = function (dialogModel) {
            // Show the overlay-options dialog
            return this.getDialogResponse(
                "overlay-options",
                { dialog: dialogModel }
            );
        };


        return DialogService;
    }
);
