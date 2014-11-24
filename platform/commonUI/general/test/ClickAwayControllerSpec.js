/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/ClickAwayController"],
    function (ClickAwayController) {
        "use strict";

        describe("The click-away controller", function () {
            var mockScope,
                mockDocument,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$apply" ]
                );
                mockDocument = jasmine.createSpyObj(
                    "$document",
                    [ "on", "off" ]
                );
                controller = new ClickAwayController(mockScope, mockDocument);
            });

            it("is initially inactive", function () {
                expect(controller.isActive()).toBe(false);
            });

            it("does not listen to the document before being toggled", function () {
                expect(mockDocument.on).not.toHaveBeenCalled();
            });

            it("tracks enabled/disabled state when toggled", function () {
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
            });

            it("allows active state to be explictly specified", function () {
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
            });

            it("registers a mouse listener when activated", function () {
                controller.setState(true);
                expect(mockDocument.on).toHaveBeenCalled();
            });

            it("deactivates and detaches listener on document click", function () {
                var callback;
                controller.setState(true);
                callback = mockDocument.on.mostRecentCall.args[1];
                callback();
                expect(controller.isActive()).toEqual(false);
                expect(mockDocument.off).toHaveBeenCalledWith("mouseup", callback);
            });



        });
    }
);