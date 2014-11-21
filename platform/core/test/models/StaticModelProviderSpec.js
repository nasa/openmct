/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * StaticModelProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/models/StaticModelProvider"],
    function (StaticModelProvider) {
        "use strict";

        describe("The static model provider", function () {
            var models = [
                    {
                        "id": "a",
                        "model": {
                            "name": "Thing A",
                            "someProperty": "Some Value A"
                        }
                    },
                    {
                        "id": "b",
                        "model": {
                            "name": "Thing B",
                            "someProperty": "Some Value B"
                        }
                    }
                ],
                mockLog,
                mockQ,
                provider;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["when"]);
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                provider = new StaticModelProvider(models, mockQ, mockLog);
            });

            it("provides models from extension declarations", function () {
                var mockPromise = { then: function () { return; } };
                mockQ.when.andReturn(mockPromise);

                // Verify that we got the promise as the return value
                expect(provider.getModels(["a", "b"])).toEqual(mockPromise);

                // Verify that the promise has the desired models
                expect(mockQ.when.callCount).toEqual(1);
                expect(mockQ.when.mostRecentCall.args[0].a.name).toEqual("Thing A");
                expect(mockQ.when.mostRecentCall.args[0].a.someProperty).toEqual("Some Value A");
                expect(mockQ.when.mostRecentCall.args[0].b.name).toEqual("Thing B");
                expect(mockQ.when.mostRecentCall.args[0].b.someProperty).toEqual("Some Value B");
            });


            it("does not provide models which are not in extension declarations", function () {
                provider.getModels(["c"]);

                // Verify that the promise has the desired models
                expect(mockQ.when.callCount).toEqual(1);
                expect(mockQ.when.mostRecentCall.args[0].c).toBeUndefined();
            });

            it("logs a warning when model definitions are malformed", function () {
                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Shouldn't fail with an exception
                expect(new StaticModelProvider([
                    { "bad": "no id" },
                    { "id": "...but no model..." },
                    { "model": "...and no id..." },
                    { "id": -40, "model": {} },
                    { "model": "should be an object", "id": "x" }
                ], mockQ, mockLog)).toBeDefined();

                // Should show warnings
                expect(mockLog.warn.callCount).toEqual(5);
            });

        });
    }
);