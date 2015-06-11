/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/services/Throttle"],
    function (Throttle) {
        "use strict";

        describe("The 'throttle' service", function () {
            var throttle,
                mockTimeout,
                mockFn,
                mockPromise;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy("$timeout");
                mockPromise = jasmine.createSpyObj("promise", ["then"]);
                mockFn = jasmine.createSpy("fn");
                mockTimeout.andReturn(mockPromise);
                throttle = new Throttle(mockTimeout);
            });

            it("provides functions which run on a timeout", function () {
                var throttled = throttle(mockFn);
                // Verify precondition: Not called at throttle-time
                expect(mockTimeout).not.toHaveBeenCalled();
                expect(throttled()).toEqual(mockPromise);
                expect(mockTimeout).toHaveBeenCalledWith(mockFn, 0, false);
            });

            it("schedules only one timeout at a time", function () {
                var throttled = throttle(mockFn);
                throttled();
                throttled();
                throttled();
                expect(mockTimeout.calls.length).toEqual(1);
            });

            it("schedules additional invocations after resolution", function () {
                var throttled = throttle(mockFn);
                throttled();
                mockPromise.then.mostRecentCall.args[0](); // Resolve timeout
                throttled();
                mockPromise.then.mostRecentCall.args[0]();
                throttled();
                expect(mockTimeout.calls.length).toEqual(3);
            });
        });
    }
);
