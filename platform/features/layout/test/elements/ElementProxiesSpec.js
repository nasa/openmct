/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/ElementProxies'],
    function (ElementProxies) {
        "use strict";

        var ELEMENT_TYPES = [
            "fixed.telemetry"
        ];

        // Verify that the set of proxies exposed matches the specific
        // list above.
        describe("The set of element proxies", function () {
            ELEMENT_TYPES.forEach(function (t) {
                it("exposes a proxy wrapper for " + t + " elements", function () {
                    expect(typeof ElementProxies[t]).toEqual('function');
                });
            });

            it("exposes no additional wrappers", function () {
                expect(Object.keys(ElementProxies).length)
                    .toEqual(ELEMENT_TYPES.length);
            });
        });
    }
);
