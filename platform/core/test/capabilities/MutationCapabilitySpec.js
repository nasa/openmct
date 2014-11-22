/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MutationCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/MutationCapability"],
    function (MutationCapability) {
        "use strict";

        describe("The mutation capability", function () {
            var testModel,
                domainObject = { getModel: function () { return testModel; } },
                mutation;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return (value && value.then) ?
                                value : mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                testModel = { number: 6 };
                mutation = new MutationCapability(
                    { when: mockPromise }, // $q
                    domainObject
                );
            });

            it("allows mutation of a model", function () {
                mutation.invoke(function (m) {
                    m.number = m.number * 7;
                });
                expect(testModel.number).toEqual(42);
            });

            it("allows setting a model", function () {
                mutation.invoke(function (m) {
                    return { someKey: "some value" };
                });
                expect(testModel.number).toBeUndefined();
                expect(testModel.someKey).toEqual("some value");
            });

            it("allows model mutation to be aborted", function () {
                mutation.invoke(function (m) {
                    m.number = m.number * 7;
                    return false; // Should abort change
                });
                // Number should not have been changed
                expect(testModel.number).toEqual(6);
            });
        });
    }
);