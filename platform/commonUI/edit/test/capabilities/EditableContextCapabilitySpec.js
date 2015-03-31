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
                mockFactory,
                capability;

            beforeEach(function () {
                // EditableContextCapability should watch ALL
                // methods for domain objects, so give it an
                // arbitrary interface to wrap.
                mockContext =
                    jasmine.createSpyObj("context", [ "getDomainObject", "getRoot" ]);
                mockTestObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockFactory = jasmine.createSpyObj(
                    "factory",
                    ["getEditableObject", "isRoot"]
                );

                someValue = { x: 42 };

                mockContext.getRoot.andReturn(mockTestObject);
                mockContext.getDomainObject.andReturn(mockTestObject);
                mockFactory.getEditableObject.andReturn(someValue);
                mockFactory.isRoot.andReturn(true);

                capability = new EditableContextCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    mockFactory
                );

            });

            it("presumes idempotence of its wrapped capability", function () {
                expect(capability.getDomainObject())
                    .toEqual(capability.getDomainObject());
                expect(mockContext.getDomainObject.calls.length).toEqual(1);
            });

            it("hides the root object", function () {
                expect(capability.getRoot()).toEqual(mockEditableObject);
                expect(capability.getPath()).toEqual([mockEditableObject]);
            });

            it("exposes the root object through a different method", function () {
                // Should still go through the factory...
                expect(capability.getTrueRoot()).toEqual(someValue);
                // ...with value of the unwrapped capability's getRoot
                expect(mockFactory.getEditableObject)
                    .toHaveBeenCalledWith(mockTestObject);
            });
        });
    }
);