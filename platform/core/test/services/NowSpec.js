/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/services/Now"],
    function (Now) {
        "use strict";

        describe("The 'now' service", function () {
            var now = new Now();

            it("reports system time", function () {
                var a = Date.now(),
                    b = now(),
                    c = Date.now();

                // Clock could, in principle, tick between evaluating the
                // expressions above. We can't predict or prevent this but
                // want the test to be stable, so we only verify that now()
                // returns a value that makes sense given a previous and
                // subsequent measurement from Date.now()
                expect(a <= b).toBeTruthy();
                expect(b <= c).toBeTruthy();
                expect(b).toBeDefined();
            });

        });
    }
);