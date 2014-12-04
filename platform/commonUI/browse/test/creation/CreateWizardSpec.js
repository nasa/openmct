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
                wizard;

            function createMockProperty(name) {
                var mockProperty = jasmine.createSpyObj(
                    "property" + name,
                    [ "getDefinition", "getValue", "setValue" ]
                );
                mockProperty.getDefinition.andReturn({});
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

                mockType.getKey.andReturn("test");
                mockType.getGlyph.andReturn("T");
                mockType.getDescription.andReturn("a test type");
                mockType.getName.andReturn("Test");
                mockType.getInitialModel.andReturn({});
                mockType.getProperties.andReturn(mockProperties);

                wizard = new CreateWizard(
                    mockType,
                    mockParent
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
                        { type: 'test' },
                        "field " + i
                    );
                });


            });


        });
    }
);