/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/directives/MCTResize"],
    function (MCTResize) {
        "use strict";

        describe("The mct-resize directive", function () {
            var mockTimeout,
                mockScope,
                testElement,
                testAttrs,
                mctResize;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy("$timeout");
                mockScope = jasmine.createSpyObj("$scope", ["$eval", "$on"]);

                testElement = { offsetWidth: 100, offsetHeight: 200 };
                testAttrs = { mctResize: "some-expr" };

                mctResize = new MCTResize(mockTimeout);
            });

            it("is applicable as an attribute only", function () {
                expect(mctResize.restrict).toEqual("A");
            });

            it("starts tracking size changes upon link", function () {
                expect(mockTimeout).not.toHaveBeenCalled();
                mctResize.link(mockScope, [testElement], testAttrs);
                expect(mockTimeout).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Number)
                );
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctResize,
                    { bounds: { width: 100, height: 200 } }
                );
            });

            it("reports size changes on a timeout", function () {
                mctResize.link(mockScope, [testElement], testAttrs);

                // Change the element's apparent size
                testElement.offsetWidth = 300;
                testElement.offsetHeight = 350;

                // Shouldn't know about this yet...
                expect(mockScope.$eval).not.toHaveBeenCalledWith(
                    testAttrs.mctResize,
                    { bounds: { width: 300, height: 350 } }
                );

                // Fire the timeout
                mockTimeout.mostRecentCall.args[0]();

                // Should have triggered an evaluation of mctResize
                // with the new width & height
                expect(mockScope.$eval).toHaveBeenCalledWith(
                    testAttrs.mctResize,
                    { bounds: { width: 300, height: 350 } }
                );
            });

            it("stops size checking for size changes after destroy", function () {
                mctResize.link(mockScope, [testElement], testAttrs);

                // First, make sure there's a $destroy observer
                expect(mockScope.$on)
                    .toHaveBeenCalledWith("$destroy", jasmine.any(Function));

                // Should have scheduled the first timeout
                expect(mockTimeout.calls.length).toEqual(1);

                // Fire the timeout
                mockTimeout.mostRecentCall.args[0]();

                // Should have scheduled another timeout
                expect(mockTimeout.calls.length).toEqual(2);

                // Broadcast a destroy event
                mockScope.$on.mostRecentCall.args[1]();

                // Fire the timeout
                mockTimeout.mostRecentCall.args[0]();

                // Should NOT have scheduled another timeout
                expect(mockTimeout.calls.length).toEqual(2);
            });

        });
    }
);