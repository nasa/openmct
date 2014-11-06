/*global define,Promise,describe,it,expect,beforeEach*/

/**
 * ApplicationBootstrapperSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/bootstrap/ApplicationBootstrapper"],
    function (ApplicationBootstrapper) {
        "use strict";

        describe("The application bootstrapper", function () {
            // Test support variables
            var bootstrapper,
                captured,
                mockAngular,
                mockDocument,
                mockLog,
                mockApp;

            // Used to capture arguments to mocks
            function capture() {
                var names = Array.prototype.slice.apply(arguments, []);
                return function () {
                    var values = arguments;
                    names.forEach(function (name, index) {
                        captured[name] = values[index];
                    });
                };
            }

            // Set up the mocks before each run
            beforeEach(function () {
                captured = {};

                mockAngular = {
                    element: function (selector) {
                        captured.selector = selector;
                        return { ready: capture("callback") };
                    },
                    bootstrap: capture("element", "appNames")
                };

                mockDocument = "I am just a value.";

                mockLog = { info: capture("info") };

                mockApp = { name: "MockApp" };

                bootstrapper = new ApplicationBootstrapper(
                    mockAngular,
                    mockDocument,
                    mockLog
                );

                bootstrapper.bootstrap(mockApp);
            });

            
            // The tests.

            it("waits for the provided document element to be ready", function () {
                // Should have provided Angular a selector...
                expect(captured.selector).toBe(mockDocument);
                // ...and called ready on the response.
                expect(captured.callback).toBeDefined();
            });

            it("issues a bootstrap call once ready", function () {
                // Verify precondition; bootstrap not called
                expect(captured.element).toBeUndefined();
                expect(captured.appNames).toBeUndefined();

                // Call the "ready" function
                captured.callback();

                // Verify that bootstrap was called
                expect(captured.element).toBe(mockDocument);
                expect(captured.appNames).toEqual([mockApp.name]);
            });

            it("logs that the bootstrap phase has been reached", function () {
                expect(captured.info).toBeDefined();
                expect(typeof captured.info).toEqual('string');
            });

        });
    }
);