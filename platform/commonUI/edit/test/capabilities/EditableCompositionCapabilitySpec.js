/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/capabilities/EditableCompositionCapability"],
    function (EditableCompositionCapability) {
        "use strict";

        describe("An editable composition capability", function () {
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
                    jasmine.createSpyObj("context", [ "getDomainObject" ]);
                mockTestObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockFactory =
                    jasmine.createSpyObj("factory", ["getEditableObject"]);

                someValue = { x: 42 };

                mockContext.getDomainObject.andReturn(mockTestObject);
                mockFactory.getEditableObject.andReturn(someValue);

                capability = new EditableCompositionCapability(
                    mockContext,
                    mockEditableObject,
                    mockDomainObject,
                    mockFactory
                );

            });

            // Most behavior is tested for EditableLookupCapability,
            // so just verify that this isse
            it("presumes non-idempotence of its wrapped capability", function () {
                expect(capability.getDomainObject())
                    .toEqual(capability.getDomainObject());
                expect(mockContext.getDomainObject.calls.length).toEqual(2);
            });

        });
    }
);