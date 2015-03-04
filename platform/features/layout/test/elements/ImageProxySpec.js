/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/ImageProxy'],
    function (ImageProxy) {
        "use strict";

        describe("A fixed position image proxy", function () {
            var testElement,
                testElements,
                proxy;

            beforeEach(function () {
                testElement = {
                    x: 1,
                    y: 2,
                    width: 42,
                    height: 24,
                    url: "http://www.nasa.gov"
                };
                testElements = [ {}, {}, testElement, {} ];
                proxy = new ImageProxy(
                    testElement,
                    testElements.indexOf(testElement),
                    testElements
                );
            });

            it("provides getter/setter for image URL", function () {
                expect(proxy.url()).toEqual("http://www.nasa.gov");
                expect(proxy.url("http://www.nasa.gov/some.jpg"))
                    .toEqual("http://www.nasa.gov/some.jpg");
                expect(proxy.url()).toEqual("http://www.nasa.gov/some.jpg");
            });
        });
    }
);
