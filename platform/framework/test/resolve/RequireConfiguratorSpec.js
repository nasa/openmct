/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,runs*/

define(
    ["../../src/resolve/RequireConfigurator", "../../src/load/Bundle"],
    function (RequireConfigurator, Bundle) {
        "use strict";

        describe("The RequireJS configurator", function () {
            var mockRequire,
                configurator;

            beforeEach(function () {
                mockRequire = jasmine.createSpyObj(
                    "requirejs",
                    [ "config" ]
                );
                configurator = new RequireConfigurator(mockRequire);
            });

            it("configures RequireJS when invoked", function () {
                // Verify precondition - no config call
                expect(mockRequire.config).not.toHaveBeenCalled();
                // Configure with an empty set of bundles
                configurator.configure([]);
                // Should have invoked require.config
                expect(mockRequire.config).toHaveBeenCalled();
            });

            it("assembles configurations from bundles", function () {
                configurator.configure([
                    new Bundle("test/a", { configuration: {
                        paths: { a: "path/to/a", b: "path/to/b" }
                    } }),
                    new Bundle("test/b", { configuration: {
                        paths: { b: "path/to/b" },
                        shim: {
                            b: { "exports": "someExport" },
                            c: {}
                        }
                    } }),
                    new Bundle("test/c", { configuration: {
                        shim: {
                            c: { "exports": "someOtherExport" }
                        }
                    } })
                ]);

                expect(mockRequire.config).toHaveBeenCalledWith({
                    baseUrl: "",
                    paths: {
                        a: "test/a/lib/path/to/a",
                        b: "test/b/lib/path/to/b"
                    },
                    shim: {
                        b: { "exports": "someExport" },
                        c: { "exports": "someOtherExport" }
                    }
                });

            });
        });
    }
);