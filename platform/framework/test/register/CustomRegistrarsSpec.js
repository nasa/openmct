/*global define,Promise,describe,it,expect,beforeEach*/

/**
 * CustomRegistrarsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/CustomRegistrars"],
    function (CustomRegistrars) {
        "use strict";

        describe("Custom registrars", function () {
            var mockLog,
                mockApp,
                customRegistrars;

            // Set up mock test dependencies
            beforeEach(function () {
                mockApp = jasmine.createSpyObj("app", [
                    "controller",
                    "directive",
                    "service",
                    "config"
                ]);

                mockLog = jasmine.createSpyObj("$log", [
                    "error",
                    "warn",
                    "info",
                    "debug"
                ]);

                customRegistrars = new CustomRegistrars(mockApp, mockLog);
            });

            it("has custom registrars for Angular built-ins", function () {
                expect(customRegistrars.directives).toBeTruthy();
                expect(customRegistrars.controllers).toBeTruthy();
                expect(customRegistrars.services).toBeTruthy();
                expect(customRegistrars.routes).toBeTruthy();
            });

            it("invokes built-in functions on the app", function () {
                // Verify preconditions, invoke, expect to have been called
                expect(mockApp.directive.calls.length).toEqual(0);
                customRegistrars.directives([{ key: "a" }, { key: "b" }, { key: "c" }]);
                expect(mockApp.directive.calls.length).toEqual(3);

                expect(mockApp.controller.calls.length).toEqual(0);
                customRegistrars.controllers([{ key: "a" }, { key: "b" }, { key: "c" }]);
                expect(mockApp.controller.calls.length).toEqual(3);

                expect(mockApp.service.calls.length).toEqual(0);
                customRegistrars.services([{ key: "a" }, { key: "b" }, { key: "c" }]);
                expect(mockApp.service.calls.length).toEqual(3);
            });

            it("warns when keys are not defined, then skips", function () {
                // Verify preconditions, invoke, expect to have been called
                expect(mockApp.directive.calls.length).toEqual(0);
                customRegistrars.directives([{ key: "a" }, { }, { key: "c" }]);
                expect(mockApp.directive.calls.length).toEqual(2);
                expect(mockLog.warn.calls.length).toEqual(1);

                expect(mockApp.controller.calls.length).toEqual(0);
                customRegistrars.controllers([{ }, { }, { key: "c" }]);
                expect(mockApp.controller.calls.length).toEqual(1);
                expect(mockLog.warn.calls.length).toEqual(3);

                expect(mockApp.service.calls.length).toEqual(0);
                customRegistrars.services([{ }, { }, { }]);
                expect(mockApp.service.calls.length).toEqual(0);
                expect(mockLog.warn.calls.length).toEqual(6);
            });

            it("allows routes to be registered", function () {
                var mockRouteProvider = jasmine.createSpyObj(
                        "$routeProvider",
                        ["when", "otherwise"]
                    ),
                    bundle = { path: "test/bundle", resources: "res" },
                    routes = [
                        {
                            when: "foo",
                            templateUrl: "templates/test.html",
                            bundle: bundle
                        },
                        {
                            templateUrl: "templates/default.html",
                            bundle: bundle
                        }
                    ],
                    configCall;

                customRegistrars.routes(routes);

                // Give it the route provider based on its config call
                mockApp.config.calls.forEach(function (call) {
                    // Invoke the provided callback
                    call.args[0][1](mockRouteProvider);
                });

                // The "when" clause should have been mapped to the when method...
                expect(mockRouteProvider.when).toHaveBeenCalled();
                expect(mockRouteProvider.when.mostRecentCall.args[0]).toEqual("foo");
                expect(mockRouteProvider.when.mostRecentCall.args[1].templateUrl)
                    .toEqual("test/bundle/res/templates/test.html");

                // ...while the other should have been treated as a default route
                expect(mockRouteProvider.otherwise).toHaveBeenCalled();
                expect(mockRouteProvider.otherwise.mostRecentCall.args[0].templateUrl)
                    .toEqual("test/bundle/res/templates/default.html");
            });

            it("accepts components for service compositing", function () {
                // Most relevant code will be exercised in service compositor spec
                expect(customRegistrars.components).toBeTruthy();
                customRegistrars.components([]);
            });
        });
    }
);