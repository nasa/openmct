/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/CreateWizard"],
    function (CreateWizard) {
        "use strict";

        describe("The create wizard", function () {
            var mockType,
                mockParent,
                mockProperties,
                mockPolicyService,
                testModel,
                wizard;

            function createMockProperty(name) {
                var mockProperty = jasmine.createSpyObj(
                    "property" + name,
                    [ "getDefinition", "getValue", "setValue" ]
                );
                mockProperty.getDefinition.andReturn({});
                mockProperty.getValue.andReturn(name);
                return mockProperty;
            }

            beforeEach(function () {
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getGlyph",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel"
                    ]
                );
                mockParent = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel",
                        "getCapability"
                    ]
                );
                mockProperties = [ "A", "B", "C" ].map(createMockProperty);
                mockPolicyService = jasmine.createSpyObj('policyService', ['allow']);

                testModel = { someKey: "some value" };

                mockType.getKey.andReturn("test");
                mockType.getGlyph.andReturn("T");
                mockType.getDescription.andReturn("a test type");
                mockType.getName.andReturn("Test");
                mockType.getInitialModel.andReturn(testModel);
                mockType.getProperties.andReturn(mockProperties);

                wizard = new CreateWizard(
                    mockType,
                    mockParent,
                    mockPolicyService
                );
            });

            it("creates a form model with a Properties section", function () {
                expect(wizard.getFormStructure().sections[0].name)
                    .toEqual("Properties");
            });

            it("adds one row per defined type property", function () {
                // Three properties were defined in the mock type
                expect(wizard.getFormStructure().sections[0].rows.length)
                    .toEqual(3);
            });

            it("interprets form data using type-defined properties", function () {
                // Use key names from mock properties
                wizard.createModel([
                    "field 0",
                    "field 1",
                    "field 2"
                ]);

                // Should have gotten a setValue call
                mockProperties.forEach(function (mockProperty, i) {
                    expect(mockProperty.setValue).toHaveBeenCalledWith(
                        { someKey: "some value", type: 'test' },
                        "field " + i
                    );
                });
            });

            it("looks up initial values from properties", function () {
                var initialValue = wizard.getInitialFormValue();

                expect(initialValue[0]).toEqual("A");
                expect(initialValue[1]).toEqual("B");
                expect(initialValue[2]).toEqual("C");

                // Verify that expected argument was passed
                mockProperties.forEach(function (mockProperty) {
                    expect(mockProperty.getValue)
                        .toHaveBeenCalledWith(testModel);
                });
            });

            it("validates selection types using policy", function () {
                var mockDomainObject = jasmine.createSpyObj(
                        'domainObject',
                        ['getCapability']
                    ),
                    mockOtherType = jasmine.createSpyObj(
                        'otherType',
                        ['getKey']
                    ),
                    structure = wizard.getFormStructure(),
                    sections = structure.sections,
                    rows = structure.sections[sections.length - 1].rows,
                    locationRow = rows[rows.length - 1];

                mockDomainObject.getCapability.andReturn(mockOtherType);
                locationRow.validate(mockDomainObject);

                // Should check policy to see if the user-selected location
                // can actually contain objects of this type
                expect(mockPolicyService.allow).toHaveBeenCalledWith(
                    'composition',
                    mockOtherType,
                    mockType
                );
            });


        });
    }
);