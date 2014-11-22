/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * DomainObjectSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/objects/DomainObject"],
    function (DomainObject) {
        "use strict";

        describe("A domain object", function () {
            var testId = "test id",
                testModel = { someKey: "some value"},
                testCapabilities = {
                    "static": "some static capability",
                    "dynamic": function (domainObject) {
                        return "Dynamically generated for " +
                                    domainObject.getId();
                    },
                    "invokable": {
                        invoke: function (arg) {
                            return "invoked with " + arg;
                        }
                    }
                },
                domainObject;

            beforeEach(function () {
                domainObject = new DomainObject(
                    testId,
                    testModel,
                    testCapabilities
                );
            });

            it("reports its id", function () {
                expect(domainObject.getId()).toEqual(testId);
            });

            it("reports its model", function () {
                expect(domainObject.getModel()).toEqual(testModel);
            });

            it("reports static capabilities", function () {
                expect(domainObject.getCapability("static"))
                    .toEqual("some static capability");
            });

            it("instantiates dynamic capabilities", function () {
                expect(domainObject.getCapability("dynamic"))
                    .toEqual("Dynamically generated for test id");
            });

            it("allows for checking for the presence of capabilities", function () {
                Object.keys(testCapabilities).forEach(function (capability) {
                    expect(domainObject.hasCapability(capability)).toBeTruthy();
                });
                expect(domainObject.hasCapability("somethingElse")).toBeFalsy();
            });

            it("allows for shorthand capability invocation", function () {
                expect(domainObject.useCapability("invokable", "a specific value"))
                    .toEqual("invoked with a specific value");
            });

        });
    }
);