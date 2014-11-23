/*global define,Promise*/

/**
 * Module defining DialogService. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function DialogService($document, $compile, $rootScope, $timeout, $q, $log) {
            var scope;

            function addContent() {
                scope = $rootScope.$new();
                $document.find('body').prepend(
                    $compile(
                        "<mct-include ng-model=\"dialog\" key=\"'overlay-dialog'\"></mct-include>"
                    )(scope)
                );
                scope.dialog = { visible: false, value: {} };
            }

            function dismiss() {
                scope.dialog = { visible: false, value: {} };
            }

            return {
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
                                title
                            ].join(""));
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