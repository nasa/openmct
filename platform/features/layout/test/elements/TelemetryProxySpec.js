/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/TelemetryProxy'],
    function (TelemetryProxy) {
        "use strict";

        describe("A fixed position telemetry proxy", function () {
            var testElement,
                testElements,
                proxy;

            beforeEach(function () {
                testElement = {
                    x: 1,
                    y: 2,
                    z: 3,
                    width: 42,
                    height: 24,
                    id: "test-id"
                };
                testElements = [ {}, {}, testElement, {} ];
                proxy = new TelemetryProxy(
                    testElement,
                    testElements.indexOf(testElement),
                    testElements
                );
            });

            it("exposes the element's id", function () {
                expect(proxy.id).toEqual('test-id');
            });
        });
    }
);
