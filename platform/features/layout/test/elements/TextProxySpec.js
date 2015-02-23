/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/TextProxy'],
    function (TextProxy) {
        "use strict";

        describe("A fixed position text proxy", function () {
            var testElement,
                testElements,
                proxy;

            beforeEach(function () {
                testElement = {
                    x: 1,
                    y: 2,
                    width: 42,
                    height: 24,
                    fill: "transparent"
                };
                testElements = [ {}, {}, testElement, {} ];
                proxy = new TextProxy(
                    testElement,
                    testElements.indexOf(testElement),
                    testElements
                );
            });

            it("provides getter/setter for fill color", function () {
                expect(proxy.fill()).toEqual('transparent');
                expect(proxy.fill('#FFF')).toEqual('#FFF');
                expect(proxy.fill()).toEqual('#FFF');
            });
        });
    }
);
