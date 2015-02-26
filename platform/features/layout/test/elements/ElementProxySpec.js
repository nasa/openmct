/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/ElementProxy'],
    function (ElementProxy) {
        "use strict";

        describe("A fixed position element proxy", function () {
            var testElement,
                testElements,
                proxy;

            beforeEach(function () {
                testElement = {
                    x: 1,
                    y: 2,
                    z: 3,
                    width: 42,
                    height: 24
                };
                testElements = [ {}, {}, testElement, {} ];
                proxy = new ElementProxy(
                    testElement,
                    testElements.indexOf(testElement),
                    testElements
                );
            });

            it("exposes element properties", function () {
                Object.keys(testElement).forEach(function (k) {
                    expect(proxy[k]()).toEqual(testElement[k]);
                });
            });

            it("allows elements to be removed", function () {
                proxy.remove();
                expect(testElements).toEqual([{}, {}, {}]);
            });
        });
    }
);
