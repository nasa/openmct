/*global define,Promise,describe,it,expect,beforeEach,jasmine,waitsFor,runs*/

/**
 * ExtensionResolverSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/resolve/ExtensionResolver", "../../src/load/Bundle"],
    function (ExtensionResolver, Bundle) {
        "use strict";

        describe("", function () {
            var mockLoader,
                mockLog,
                resolver;

            // Test implementation, to load from the mock loader
            function Constructor() { return { someKey: "some value" }; }
            Constructor.someProperty = "some static value";

            beforeEach(function () {
                mockLoader = jasmine.createSpyObj("loader", ["load"]);

                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );

                mockLoader.load.andReturn(Promise.resolve(Constructor));

                resolver = new ExtensionResolver(mockLoader, mockLog);
            });

            it("requests implementations from the implementation loader", function () {
                var bundle = new Bundle("w", {
                        sources: "x",
                        extensions: { tests: [ { implementation: "y/z.js" } ] }
                    }),
                    extension = bundle.getExtensions("tests")[0],
                    result;

                resolver.resolve(extension).then(function (v) { result = v; });

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                runs(function () {
                    // Verify that the right file was requested
                    expect(mockLoader.load).toHaveBeenCalledWith("w/x/y/z.js");

                    // We should have resolved to the constructor from above
                    expect(typeof result).toEqual('function');
                    expect(result().someKey).toEqual("some value");
                });
            });


            it("issues a warning and defaults to plain definition if load fails", function () {
                var bundle = new Bundle("w", {
                        sources: "x",
                        extensions: { tests: [ {
                            someOtherKey: "some other value",
                            implementation: "y/z.js"
                        } ] }
                    }),
                    extension = bundle.getExtensions("tests")[0],
                    result;

                mockLoader.load.andReturn(Promise.reject(new Error("test error")));
                resolver.resolve(extension).then(function (v) { result = v; });

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                runs(function () {
                    // Should have gotten a warning
                    expect(mockLog.warn).toHaveBeenCalled();

                    // We should have resolved to the plain definition from above
                    expect(typeof result).not.toEqual('function');
                    expect(result.someOtherKey).toEqual("some other value");
                });
            });

            it("ensures implementation properties are exposed", function () {
                var bundle = new Bundle("w", {
                        sources: "x",
                        extensions: { tests: [ { implementation: "y/z.js" } ] }
                    }),
                    extension = bundle.getExtensions("tests")[0],
                    result;

                resolver.resolve(extension).then(function (v) { result = v; });

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                runs(function () {
                    // Verify that the right file was requested
                    expect(mockLoader.load).toHaveBeenCalledWith("w/x/y/z.js");

                    // We should have resolved to the constructor from above
                    expect(typeof result).toEqual('function');
                    expect(result().someKey).toEqual("some value");
                    expect(result.someProperty).toEqual("some static value");
                });
            });


        });
    }
);