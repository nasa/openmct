/*global define,Promise*/

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
                    var resultingValue;

                    // Temporary workaround, in the absence of a
                    // forms package.
                    try {
                        resultingValue = JSON.parse(overlayModel.value);
                    } catch (e) {
                        resultingValue = {};
                    }

                    // Pass along the result
                    deferred.resolve(resultingValue);

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
                        formModel: formModel,
                        value: JSON.stringify(value),
                        confirm: confirm,
                        cancel: cancel
                    };

                    // Add the overlay using the OverlayService, which
                    // will handle actual insertion into the DOM
                    overlay = overlayService.createOverlay(
                        overlayModel,
                        "overlay-dialog"
                    );
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
                getUserInput: getUserInput
            };
        }

        return DialogService;
    }
);