/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * ContextCapability. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/ContextCapability"],
    function (ContextCapability) {
        "use strict";

        var DOMAIN_OBJECT_METHODS = [
            "getId",
            "getModel",
            "getCapability",
            "hasCapability",
            "useCapability"
        ];

        describe("The context capability", function () {
            var mockDomainObject,
                mockParent,
                mockGrandparent,
                mockContext,
                context;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockParent = jasmine.createSpyObj("parent", DOMAIN_OBJECT_METHODS);
                mockGrandparent = jasmine.createSpyObj("grandparent", DOMAIN_OBJECT_METHODS);
                mockContext = jasmine.createSpyObj("context", [ "getParent", "getRoot", "getPath" ]);

                mockParent.getCapability.andReturn(mockContext);
                mockContext.getParent.andReturn(mockGrandparent);
                mockContext.getRoot.andReturn(mockGrandparent);
                mockContext.getPath.andReturn([mockGrandparent, mockParent]);

                context = new ContextCapability(mockParent, mockDomainObject);
            });

            it("allows an object's parent to be retrieved", function () {
                expect(context.getParent()).toEqual(mockParent);
            });

            it("allows an object's full ancestry to be retrieved", function () {
                expect(context.getPath()).toEqual([mockGrandparent, mockParent, mockDomainObject]);
            });

            it("allows the deepest ancestor of an object to be retrieved", function () {
                expect(context.getRoot()).toEqual(mockGrandparent);
            });

            it("treats ancestors with no context capability as deepest ancestors", function () {
                mockParent.getCapability.andReturn(undefined);
                expect(context.getPath()).toEqual([mockParent, mockDomainObject]);
                expect(context.getRoot()).toEqual(mockParent);
            });


        });
    }
);