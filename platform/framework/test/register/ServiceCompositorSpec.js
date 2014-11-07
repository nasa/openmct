/*global define,Promise,describe,it,expect,beforeEach,jasmine*/

/**
 * ServiceCompositorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/ServiceCompositor"],
    function (ServiceCompositor) {
        "use strict";

        describe("The service compositor", function () {
            var registered,
                mockApp,
                mockLog,
                compositor;


            beforeEach(function () {
                registered = {};

                mockApp = jasmine.createSpyObj("app", [ "service" ]);
                mockLog = jasmine.createSpyObj("$log", [ "error", "warn", "info", "debug" ]);

                mockApp.service.andCallFake(function (name, value) {
                    var factory = value[value.length - 1];

                    registered[name] = {
                        depends: value.slice(0, value.length - 1),
                        callback: value[value.length - 1]
                    };

                    // Track what name it was registered under
                    factory.registeredName = name;
                });

                compositor = new ServiceCompositor(mockApp, mockLog);
            });

            it("allows composite services to be registered", function () {
                compositor.registerCompositeServices([
                    { type: "provider", provides: "testService" }
                ]);

                expect(mockApp.service).toHaveBeenCalled();
            });

            it("allows composite services to be registered", function () {
                // Prepare components that look like resolved extensions
                var components, name;
                function MyDecorator() { return {}; }
                function MyOtherDecorator() { return {}; }
                function MyProvider() { return {}; }
                function MyOtherProvider() { return {}; }
                function MyAggregator() { return {}; }

                components = [
                    MyDecorator,
                    MyProvider,
                    MyAggregator,
                    MyOtherDecorator,
                    MyOtherProvider
                ];

                MyDecorator.type = "decorator";
                MyOtherDecorator.type = "decorator";
                MyProvider.type = "provider";
                MyOtherProvider.type = "provider";
                MyAggregator.type = "aggregator";
                components.forEach(function (c) { c.provides = "testService"; });

                // Add some test dependencies, to check prepending
                MyOtherDecorator.depends = [ "someOtherService" ];
                MyAggregator.depends = [ "tests[]" ];

                // Register!
                compositor.registerCompositeServices(components);

                expect(mockApp.service).toHaveBeenCalled();

                // Verify some interesting spots on dependency graph
                expect(registered.testService.depends).toEqual([
                    MyOtherDecorator.registeredName
                ]);
                expect(registered[MyOtherDecorator.registeredName].depends).toEqual([
                    "someOtherService",
                    MyDecorator.registeredName
                ]);
                expect(registered[MyAggregator.registeredName].depends.length).toEqual(2);
                // Get the name of the group of providers
                name = registered[MyAggregator.registeredName].depends[1];
                // ...it should depend on both providers
                expect(registered[name].depends).toEqual([
                    MyProvider.registeredName,
                    MyOtherProvider.registeredName
                ]);
            });

            it("allows registered composite services to be instantiated", function () {
                // Prepare components that look like resolved extensions
                var components, name;
                function MyProvider() { return {}; }
                function MyOtherProvider() { return {}; }
                function MyAggregator() { return {}; }

                components = [ MyProvider, MyAggregator, MyOtherProvider ];

                MyProvider.type = "provider";
                MyOtherProvider.type = "provider";
                MyAggregator.type = "aggregator";
                components.forEach(function (c) { c.provides = "testService"; });

                // Register!
                compositor.registerCompositeServices(components);

                expect(mockApp.service).toHaveBeenCalled();

                // Test service should just be a reflecting dependency;
                // it will depend upon (then return) the aggregator.
                expect(registered.testService.callback("hello")).toEqual("hello");

                // The aggregated provider dependencies should be similar,
                // except they should reflect back the array of arguments.
                // Get the name of the group of providers
                name = registered[MyAggregator.registeredName].depends[0];
                // ...it should depend on both providers
                expect(registered[name].callback(1, 2, "hello")).toEqual([1, 2, "hello"]);

            });

            it("warns and skips components with no service type", function () {
                // Prepare components that look like resolved extensions
                var components;
                function MyProvider() { return {}; }
                function MyDecorator() { return {}; }
                function MyAggregator() { return {}; }

                components = [ MyProvider, MyAggregator, MyDecorator ];

                MyProvider.type = "provider";
                MyDecorator.type = "decorator";
                MyAggregator.type = "aggregator";

                // Notably, we don't do
                // components.forEach(function (c) { c.provides = "testService"; });

                // Try to register...
                compositor.registerCompositeServices(components);

                // Nothing should have gotten registered
                expect(mockApp.service).not.toHaveBeenCalled();

                // Should have gotten one warning for each skipped component
                expect(mockLog.warn.calls.length).toEqual(3);
            });

            it("warns about and skips aggregators with zero providers", function () {
                // Prepare components that look like resolved extensions
                var components;
                function MyAggregator() { return {}; }

                components = [ MyAggregator ];

                MyAggregator.type = "aggregator";
                MyAggregator.provides = "testService";

                // Try to register...
                compositor.registerCompositeServices(components);

                // Nothing should have gotten registered
                expect(mockApp.service).not.toHaveBeenCalled();

                // Should have gotten a warning
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("warns about and skips decorators with nothing to decorate", function () {
                // Prepare components that look like resolved extensions
                var components;
                function MyDecorator() { return {}; }

                components = [ MyDecorator ];

                MyDecorator.type = "decorator";
                MyDecorator.provides = "testService";

                // Try to register...
                compositor.registerCompositeServices(components);

                // Nothing should have gotten registered
                expect(mockApp.service).not.toHaveBeenCalled();

                // Should have gotten a warning
                expect(mockLog.warn).toHaveBeenCalled();
            });

        });
    }
);