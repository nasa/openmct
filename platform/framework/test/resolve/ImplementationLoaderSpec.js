/*global define,Promise,describe,it,expect,beforeEach,waitsFor,runs*/

/**
 * ImplementationLoaderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/resolve/ImplementationLoader"],
    function (ImplementationLoader) {
        "use strict";

        describe("The implementation loader", function () {
            var required,
                loader;

            function mockRequire(names, fulfill, reject) {
                required = {
                    names: names,
                    fulfill: fulfill,
                    reject: reject
                };
            }

            beforeEach(function () {
                required = undefined;
                loader = new ImplementationLoader(mockRequire);
            });

            it("passes script names to require", function () {
                loader.load("xyz.js");
                expect(required.names).toEqual(["xyz.js"]);
            });

            it("wraps require results in a Promise that can resolve", function () {
                var result;

                // Load and get the result
                loader.load("xyz.js").then(function (v) { result = v; });

                expect(result).toBeUndefined();

                required.fulfill("test result");

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                runs(function () {
                    expect(result).toEqual("test result");
                });
            });

            it("wraps require results in a Promise that can reject", function () {
                var result,
                    rejection;

                // Load and get the result
                loader.load("xyz.js").then(
                    function (v) { result = v; },
                    function (v) { rejection = v; }
                );

                expect(result).toBeUndefined();

                required.reject("test result");

                waitsFor(
                    function () { return rejection !== undefined; },
                    "promise resolution",
                    250
                );

                runs(function () {
                    expect(result).toBeUndefined();
                    expect(rejection).toEqual("test result");
                });
            });

        });
    }
);