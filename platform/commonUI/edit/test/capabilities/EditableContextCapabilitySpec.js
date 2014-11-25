/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/capabilities/EditableContextCapability"],
    function (EditableContextCapability) {
        "use strict";

        describe("An editable context capability", function () {
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

                capability = new EditableContextCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    factory
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

        });
    }
);