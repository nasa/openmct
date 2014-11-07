/*global define,Promise,describe,it,expect,beforeEach,waitsFor,runs*/

/**
 * FrameworkInitializerSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/FrameworkInitializer"],
    function (FrameworkInitializer) {
        "use strict";

        describe("The framework initializer", function () {
            var initializer;

            function appender(name) {
                return function (value) {
                    return Promise.resolve(value.concat([name]));
                };
            }

            beforeEach(function () {
                initializer = new FrameworkInitializer(
                    { loadBundles: appender("loader") },
                    { resolveBundles: appender("resolver") },
                    { registerExtensions: appender("registrar") },
                    { bootstrap: appender("bootstrapper")}
                );
            });

            // Really just delegates work, can only verify the
            // order of calls.
            it("calls injected stages in order", function () {
                var result;

                initializer.runApplication([]).then(function (v) { result = v; });

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                runs(function () {
                    expect(result).toEqual(
                        ["loader", "resolver", "registrar", "bootstrapper"]
                    );
                });
            });

        });
    }
);