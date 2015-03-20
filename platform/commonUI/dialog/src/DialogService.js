/*global define*/

/**
 * Module defining DialogService. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";
        /**
         * The dialog service is responsible for handling window-modal
         * communication with the user, such as displaying forms for user
         * input.
         * @constructor
         */
        function DialogService(overlayService, $q, $log) {
            var overlay,
                dialogVisible = false;

            // Stop showing whatever overlay is currently active
            // (e.g. because the user hit cancel)
            function dismiss() {
                if (overlay) {
                    overlay.dismiss();
                }
                dialogVisible = false;
            }

            function getUserInput(formModel, value) {
                // We will return this result as a promise, because user
                // input is asynchronous.
                var deferred = $q.defer(),
                    overlayModel;

                // Confirm function; this will be passed in to the
                // overlay-dialog template and associated with a
                // OK button click
                function confirm() {
                    // Pass along the result
                    deferred.resolve(overlayModel.value);

                    // Stop showing the dialog
                    dismiss();
                }

                // Cancel function; this will be passed in to the
                // overlay-dialog template and associated with a
                // Cancel or X button click
                function cancel() {
                    deferred.reject();
                    dismiss();
                }

                if (dialogVisible) {
                    // Only one dialog should be shown at a time.
                    // The application design should be such that
                    // we never even try to do this.
                    $log.warn([
                        "Dialog already showing; ",
                        "unable to show ",
                        formModel.name
                    ].join(""));
                    deferred.reject();
                } else {
                    // To be passed to the overlay-dialog template,
                    // via ng-model
                    overlayModel = {
                        title: formModel.name,
                        message: formModel.message,
                        structure: formModel,
                        value: value,
                        confirm: confirm,
                        cancel: cancel
                    };

                    // Add the overlay using the OverlayService, which
                    // will handle actual insertion into the DOM
                    overlay = overlayService.createOverlay(
                        "overlay-dialog",
                        overlayModel
                    );

                    // Track that a dialog is already visible, to
                    // avoid spawning multiple dialogs at once.
                    dialogVisible = true;
                }

                return deferred.promise;
            }

            function getUserChoice(dialogModel) {
                // We will return this result as a promise, because user
                // input is asynchronous.
                var deferred = $q.defer();

                // Confirm function; this will be passed in to the
                // overlay-dialog template and associated with a
                // OK button click
                function confirm(value) {
                    // Pass along the result
                    deferred.resolve(value);

                    // Stop showing the dialog
                    dismiss();
                }

                // Cancel function; this will be passed in to the
                // overlay-dialog template and associated with a
                // Cancel or X button click
                function cancel() {
                    deferred.reject();
                    dismiss();
                }

                if (dialogVisible) {
                    // Only one dialog should be shown at a time.
                    // The application design should be such that
                    // we never even try to do this.
                    $log.warn([
                        "Dialog already showing; ",
                        "unable to show ",
                        dialogModel.name
                    ].join(""));
                    deferred.reject();
                } else {
                    // Add the overlay using the OverlayService, which
                    // will handle actual insertion into the DOM
                    overlay = overlayService.createOverlay(
                        "overlay-dialog",
                        { dialog: dialogModel, click: confirm }
                    );

                    // Track that a dialog is already visible, to
                    // avoid spawning multiple dialogs at once.
                    dialogVisible = true;
                }

                return deferred.promise;
            }

            return {
                /**
                 * Request user input via a window-modal dialog.
                 *
                 * @param {FormModel} formModel a description of the form
                 *        to be shown (see platform/forms)
                 * @param {object} value the initial state of the form
                 * @returns {Promise} a promsie for the form value that the
                 *          user has supplied; this may be rejected if
                 *          user input cannot be obtained (for instance,
                 *          because the user cancelled the dialog)
                 */
                getUserInput: getUserInput,
                /**
                 * Request that the user chooses from a set of options,
                 * which will be shown as buttons.
                 *
                 * @param dialogModel a description of the dialog to show
                 */
                getUserChoice: getUserChoice
            };
        }

        return DialogService;
    }
);