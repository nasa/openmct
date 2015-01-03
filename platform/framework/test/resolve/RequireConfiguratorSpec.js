/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,runs*/

define(
    ["../../src/resolve/RequireConfigurator"],
    function (RequireConfigurator) {
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
        });
    }
);