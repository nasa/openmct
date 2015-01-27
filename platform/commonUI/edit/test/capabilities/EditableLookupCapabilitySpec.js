/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/capabilities/EditableLookupCapability"],
    function (EditableLookupCapability) {
        "use strict";

        describe("An editable lookup capability", function () {
            var mockContext,
                mockEditableObject,
                mockDomainObject,
                mockTestObject,
                someValue,
                factory,
                capability;

            beforeEach(function () {
                // EditableContextCapability should watch ALL
                // methods for domain objects, so give it an
                // arbitrary interface to wrap.
                mockContext = jasmine.createSpyObj(
                    "context",
                    [
                        "getSomething",
                        "getDomainObject",
                        "getDomainObjectArray"
                    ]
                );
                mockTestObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                factory = {
                    getEditableObject: function (v) {
                        return {
                            isFromTestFactory: true,
                            calledWith: v
                        };
                    }
                };

                someValue = { x: 42 };

                mockContext.getSomething.andReturn(someValue);
                mockContext.getDomainObject.andReturn(mockTestObject);
                mockContext.getDomainObjectArray.andReturn([mockTestObject]);

                capability = new EditableLookupCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory,
                    false
                );

            });

            it("wraps retrieved domain objects", function () {
                var object = capability.getDomainObject();
                expect(object.isFromTestFactory).toBe(true);
                expect(object.calledWith).toEqual(mockTestObject);
            });

            it("wraps retrieved domain object arrays", function () {
                var object = capability.getDomainObjectArray()[0];
                expect(object.isFromTestFactory).toBe(true);
                expect(object.calledWith).toEqual(mockTestObject);
            });

            it("does not wrap non-domain-objects", function () {
                expect(capability.getSomething()).toEqual(someValue);
            });

            it("caches idempotent lookups", function () {
                capability = new EditableLookupCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory,
                    true // idempotent
                );
                expect(capability.getDomainObject())
                    .toEqual(capability.getDomainObject());
                expect(mockContext.getDomainObject.calls.length).toEqual(1);
            });

            it("does not cache non-idempotent lookups", function () {
                capability = new EditableLookupCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory,
                    false // Not idempotent
                );
                expect(capability.getDomainObject())
                    .toEqual(capability.getDomainObject());
                expect(mockContext.getDomainObject.calls.length).toEqual(2);
            });

        });
    }
);