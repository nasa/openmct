/*global define,Promise,describe,it,expect,beforeEach,jasmine*/

/**
 * ExtensionRegistrarSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/ExtensionRegistrar"],
    function (ExtensionRegistrar) {
        "use strict";

        describe("The extension registrar", function () {
            var mockApp,
                mockLog,
                mockSorter,
                customRegistrars,
                registrar;

            beforeEach(function () {
                mockApp = jasmine.createSpyObj("app", ["factory"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "debug", "info"]);
                mockSorter = jasmine.createSpyObj("sorter", ["sort"]);
                customRegistrars = {};

                mockSorter.sort.andCallFake(function (v) { return v; });

                registrar = new ExtensionRegistrar(
                    mockApp,
                    customRegistrars,
                    mockSorter,
                    mockLog
                );
            });

            it("registers extensions using the factory", function () {
                registrar.registerExtensions({ things: [ {} ] });
                expect(mockApp.factory).toHaveBeenCalled();
            });

            it("registers extensions with square brackets, as arrays", function () {
                var callbacks = {};
                mockApp.factory.andCallFake(function (name, value) {
                    callbacks[name] = value[value.length - 1];
                });
                registrar.registerExtensions({ things: [ {} ] });
                expect(callbacks["things[]"]).toBeDefined();

                // Verify dependency echo behavior
                expect(callbacks["things[]"]("a", "b", "c")).toEqual(["a", "b", "c"]);
            });

            it("warns if multiple registrations are made for the same category of extension", function () {
                registrar.registerExtensions({ things: [ {} ] });
                expect(mockLog.warn).not.toHaveBeenCalled();
                registrar.registerExtensions({ things: [ {} ] });
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("registers empty extension categories when they are needed", function () {
                var lengths = {};
                mockApp.factory.andCallFake(function (name, value) {
                    lengths[name] = value.length;
                });
                // Nobody has registered tests[], but it looks like an extension dependency,
                // so register it as an empty array.
                registrar.registerExtensions({ things: [ { depends: [ "tests[]", "other" ] } ] });
                expect(lengths["tests[]"]).toEqual(1);
                expect(lengths.other).toBeUndefined();
            });

            it("invokes custom registrars (not app.factory) when available", function () {
                customRegistrars.things = jasmine.createSpy("things");
                registrar.registerExtensions({ things: [ {} ] });
                expect(mockApp.factory).not.toHaveBeenCalled();
                expect(customRegistrars.things).toHaveBeenCalled();
            });

            it("sorts extensions before registering", function () {
                // Some extension definitions to sort
                var a = { a: 'a' }, b = { b: 'b' }, c = { c: 'c' };

                // Fake sorting; just reverse the array
                mockSorter.sort.andCallFake(function (v) { return v.reverse(); });

                // Register the extensions
                registrar.registerExtensions({ things: [ a, b, c ] });

                // Verify registration interactions occurred in reverse-order
                [ c, b, a ].forEach(function (extension, index) {
                    expect(mockApp.factory.calls[index].args[1][0]())
                        .toEqual(extension);
                });
            });

        });
    }
);