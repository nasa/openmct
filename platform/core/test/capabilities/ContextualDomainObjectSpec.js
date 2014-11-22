/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * ContextualDomainObjectSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/ContextualDomainObject"],
    function (ContextualDomainObject) {
        "use strict";


        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("A contextual domain object", function () {
            var mockParent,
                mockDomainObject,
                model,
                contextualDomainObject;


            beforeEach(function () {
                mockParent = jasmine.createSpyObj("parent", DOMAIN_OBJECT_METHODS);
                mockDomainObject = jasmine.createSpyObj("parent", DOMAIN_OBJECT_METHODS);

                model = { someKey: "some value" };

                mockDomainObject.getCapability.andReturn("some capability");
                mockDomainObject.getModel.andReturn(model);

                contextualDomainObject = new ContextualDomainObject(
                    mockDomainObject,
                    mockParent
                );
            });


            it("adds a context capability to a domain object", function () {
                var context = contextualDomainObject.getCapability('context');

                // Expect something that looks like a context capability
                expect(context).toBeDefined();
                expect(context.getPath).toBeDefined();
                expect(context.getRoot).toBeDefined();
                expect(context.getParent()).toEqual(mockParent);
            });


            it("does not shadow other domain object methods", function () {
                expect(contextualDomainObject.getModel())
                    .toEqual(model);
                expect(contextualDomainObject.getCapability("other"))
                    .toEqual("some capability");
            });

        });
    }
);