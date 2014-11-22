/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * CoreCapabilityProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/CoreCapabilityProvider"],
    function (CoreCapabilityProvider) {
        "use strict";

        describe("The core capability provider", function () {
            var mockLog,
                provider;

            function BasicCapability() { return; }
            BasicCapability.key = "basic";

            function ApplicableCapability() { return; }
            ApplicableCapability.key = "applicable";
            ApplicableCapability.appliesTo = function (model) {
                return !model.isNotApplicable;
            };

            function KeylessCapability() { return; }

            beforeEach(function () {
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );

                provider = new CoreCapabilityProvider([
                    BasicCapability,
                    ApplicableCapability,
                    KeylessCapability
                ], mockLog);
            });

            it("returns capabilities for models, from extensions", function () {
                expect(provider.getCapabilities({})).toEqual({
                    basic: BasicCapability,
                    applicable: ApplicableCapability
                });
            });

            it("filters out capabilities which do not apply to models", function () {
                expect(provider.getCapabilities({ isNotApplicable: true })).toEqual({
                    basic: BasicCapability
                });
            });

            it("logs a warning when capability extensions have not defined keys", function () {
                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                provider.getCapabilities({});

                expect(mockLog.warn).toHaveBeenCalled();

            });

            it("does not log a warning when all capability extensions are valid", function () {
                KeylessCapability.key = "someKey";
                provider.getCapabilities({});
                expect(mockLog.warn).not.toHaveBeenCalled();
            });


        });
    }
);