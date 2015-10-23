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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTIncudeSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/DialogService"],
    function (DialogService) {
        "use strict";

        describe("The dialog service", function () {
            var mockOverlayService,
                mockQ,
                mockLog,
                mockOverlay,
                mockDeferred,
                dialogService;

            beforeEach(function () {
                mockOverlayService = jasmine.createSpyObj(
                    "overlayService",
                    [ "createOverlay" ]
                );
                mockQ = jasmine.createSpyObj(
                    "$q",
                    [ "defer" ]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    [ "warn", "info", "debug" ]
                );
                mockOverlay = jasmine.createSpyObj(
                    "overlay",
                    [ "dismiss" ]
                );
                mockDeferred = jasmine.createSpyObj(
                    "deferred",
                    [ "resolve", "reject"]
                );
                mockDeferred.promise = "mock promise";

                mockQ.defer.andReturn(mockDeferred);
                mockOverlayService.createOverlay.andReturn(mockOverlay);

                dialogService = new DialogService(
                    mockOverlayService,
                    mockQ,
                    mockLog
                );
            });

            it("adds an overlay when user input is requested", function () {
                dialogService.getUserInput({}, {});
                expect(mockOverlayService.createOverlay).toHaveBeenCalled();
            });

            it("allows user input to be canceled", function () {
                dialogService.getUserInput({}, { someKey: "some value" });
                mockOverlayService.createOverlay.mostRecentCall.args[1].cancel();
                expect(mockDeferred.reject).toHaveBeenCalled();
                expect(mockDeferred.resolve).not.toHaveBeenCalled();
            });

            it("passes back the result of user input when confirmed", function () {
                var value = { someKey: 42 };
                dialogService.getUserInput({}, value);
                mockOverlayService.createOverlay.mostRecentCall.args[1].confirm();
                expect(mockDeferred.reject).not.toHaveBeenCalled();
                expect(mockDeferred.resolve).toHaveBeenCalledWith(value);
            });

            it("logs a warning when a dialog is already showing", function () {
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).not.toHaveBeenCalled();
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).toHaveBeenCalled();
                expect(mockDeferred.reject).toHaveBeenCalled();
            });

            it("can show multiple dialogs if prior ones are dismissed", function () {
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).not.toHaveBeenCalled();
                mockOverlayService.createOverlay.mostRecentCall.args[1].confirm();
                dialogService.getUserInput({}, {});
                expect(mockLog.warn).not.toHaveBeenCalled();
                expect(mockDeferred.reject).not.toHaveBeenCalled();
            });

            it("provides an options dialogs", function () {
                var dialogModel = {};
                dialogService.getUserChoice(dialogModel);
                expect(mockOverlayService.createOverlay).toHaveBeenCalledWith(
                    'overlay-options',
                    {
                        dialog: dialogModel,
                        confirm: jasmine.any(Function),
                        cancel: jasmine.any(Function)
                    },
                    't-dialog'
                );
            });

            it("invokes the overlay service with the correct parameters when" +
                " a blocking dialog is requested", function() {
                var dialogModel = {};
                expect(dialogService.showBlockingMessage(dialogModel)).toBe(true);
                expect(mockOverlayService.createOverlay).toHaveBeenCalledWith(
                    "overlay-blocking-message",
                    dialogModel,
                    "t-dialog-sm"
                );
            });

        });
    }
);
