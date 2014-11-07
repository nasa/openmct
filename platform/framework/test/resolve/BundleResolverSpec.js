/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine,runs*/

/**
 * BundleResolverSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/resolve/BundleResolver", "../../src/load/Bundle"],
    function (BundleResolver, Bundle) {
        "use strict";

        describe("The bundle resolver", function () {
            var mockExtensionResolver,
                mockLog,
                resolver;

            beforeEach(function () {
                mockExtensionResolver = jasmine.createSpyObj(
                    "extensionResolver",
                    ["resolve"]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );
                resolver = new BundleResolver(mockExtensionResolver, mockLog);
            });

            it("invokes the extension resolver for all bundle extensions", function () {
                var result;

                mockExtensionResolver.resolve.andReturn(Promise.resolve("a"));

                resolver.resolveBundles([
                    new Bundle("x", { extensions: { tests: [ {}, {}, {} ] } }),
                    new Bundle("y", { extensions: { tests: [ {}, {} ], others: [ {}, {} ] } }),
                    new Bundle("z", { extensions: { others: [ {} ] } })
                ]).then(function (v) { result = v; });

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                // Should get back the result from the resolver, and
                // should be binned by extension category.
                runs(function () {
                    expect(result.tests).toEqual(["a", "a", "a", "a", "a"]);
                    expect(result.others).toEqual(["a", "a", "a"]);
                });
            });

        });
    }
);