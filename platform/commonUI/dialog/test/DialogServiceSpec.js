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

        });
    }
);