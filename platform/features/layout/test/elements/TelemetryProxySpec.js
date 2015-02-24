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

            it("allows title to be shown/hidden", function () {
                // Initially, only showTitle and hideTitle are available
                expect(proxy.hideTitle).toBeUndefined();
                proxy.showTitle();

                // Should have set titled state
                expect(testElement.titled).toBeTruthy();

                // Should also have changed methods available
                expect(proxy.showTitle).toBeUndefined();
                proxy.hideTitle();

                // Should have cleared titled state
                expect(testElement.titled).toBeFalsy();

                // Available methods should have changed again
                expect(proxy.hideTitle).toBeUndefined();
                proxy.showTitle();
            });

        });
    }
);
