/*global define,Promise*/

/**
 * Module defining DialogService. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        // Template to inject into the DOM to show the dialog; really just points to
        // the overlay-dialog template.
        var TEMPLATE = "<mct-include ng-model=\"dialog\" key=\"'overlay-dialog'\"></mct-include>";

        /**
         * The dialog service is responsible for handling window-modal
         * communication with the user, such as displaying forms for user
         * input.
         * @constructor
         */
        function DialogService($document, $compile, $rootScope, $timeout, $q, $log) {
            var scope;

            // Inject the dialog at the top of the body; this is necessary to
            // ensure that the dialog is positioned appropriately and can fill
            // the screen to block other interactions.
            function addContent() {
                scope = $rootScope.$new();
                $document.find('body').prepend($compile(TEMPLATE)(scope));
                scope.dialog = { visible: false, value: {} };
            }

            // Dismiss the dialog; just stop showing it, and release any
            // form information for garbage collection.
            function dismiss() {
                scope.dialog = { visible: false, value: {} };
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
                getUserInput: function (formModel, value) {
                    var deferred = $q.defer();

                    if (!scope) {
                        addContent();
                    }

                    $timeout(function () {
                        if (scope.dialog.visible) {
                            $log.warn([
                                "Dialog already showing; ",
                                "unable to show ",
                                formModel.name
                            ].join(""));
                            deferred.reject();
                            return;
                        }

                        scope.dialog.visible = true;
                        scope.dialog.title = formModel.name;
                        scope.dialog.message = formModel.message;
                        scope.dialog.formModel = formModel;
                        scope.dialog.value = JSON.stringify(value);

                        scope.dialog.confirm = function () {
                            var resultingValue;

                            try {
                                resultingValue = JSON.parse(scope.dialog.value);
                            } catch (e) {
                                resultingValue = {};
                            }
                            deferred.resolve(resultingValue);
                            dismiss();
                        };
                        scope.dialog.cancel = function () {
                            deferred.reject();
                            dismiss();
                        };
                    });

                    return deferred.promise;
                }
            };
        }

        return DialogService;
    }
);