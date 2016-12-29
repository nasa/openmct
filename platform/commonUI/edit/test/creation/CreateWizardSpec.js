/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/CreateWizard"],
    (CreateWizard) => {

        describe("The create wizard", () => {
            let mockType,
                mockParent,
                mockProperties,
                mockPolicyService,
                testModel,
                mockDomainObject,
                wizard;

            const createMockProperty = (name) => {
                let mockProperty = jasmine.createSpyObj(
                    "property" + name,
                    ["getDefinition", "getValue", "setValue"]
                );
                mockProperty.getDefinition.andReturn({
                    control: "textfield"
                });
                mockProperty.getValue.andReturn(name);
                return mockProperty;
            }

            beforeEach( () => {
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getGlyph",
                        "getCssClass",
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
                mockProperties = ["A", "B", "C"].map(createMockProperty);
                mockPolicyService = jasmine.createSpyObj('policyService', ['allow']);

                testModel = { someKey: "some value" };

                mockType.getKey.andReturn("test");
                mockType.getCssClass.andReturn("icon-telemetry");
                mockType.getDescription.andReturn("a test type");
                mockType.getName.andReturn("Test");
                mockType.getInitialModel.andReturn(testModel);
                mockType.getProperties.andReturn(mockProperties);

                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'useCapability', 'getModel']
                );

                //Mocking the getCapability('type') call
                mockDomainObject.getCapability.andReturn(mockType);
                mockDomainObject.useCapability.andReturn();
                mockDomainObject.getModel.andReturn(testModel);

                wizard = new CreateWizard(
                    mockDomainObject,
                    mockParent,
                    mockPolicyService
                );
            });

            it("creates a form model with a Properties section", () => {
                expect(wizard.getFormStructure().sections[0].name)
                    .toEqual("Properties");
            });

            it("adds one row per defined type property", () => {
                // Three properties were defined in the mock type
                expect(wizard.getFormStructure().sections[0].rows.length)
                    .toEqual(3);
            });

            it("interprets form data using type-defined properties", () => {
                // Use key names from mock properties
                wizard.createModel([
                    "field 0",
                    "field 1",
                    "field 2"
                ]);

                // Should have gotten a setValue call
                mockProperties.forEach( (mockProperty, i) => {
                    expect(mockProperty.setValue).toHaveBeenCalledWith(
                        { someKey: "some value", type: 'test' },
                        "field " + i
                    );
                });
            });

            it("looks up initial values from properties", () => {
                let initialValue = wizard.getInitialFormValue();

                expect(initialValue[0]).toEqual("A");
                expect(initialValue[1]).toEqual("B");
                expect(initialValue[2]).toEqual("C");

                // Verify that expected argument was passed
                mockProperties.forEach( (mockProperty) => {
                    expect(mockProperty.getValue)
                        .toHaveBeenCalledWith(testModel);
                });
            });

            it("populates the model on the associated object", () => {
                let formValue = {
                    "A": "ValueA",
                    "B": "ValueB",
                    "C": "ValueC"
                },
                compareModel = wizard.createModel(formValue);
                wizard.populateObjectFromInput(formValue);
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith('mutation', jasmine.any(Function));
                expect(mockDomainObject.useCapability.mostRecentCall.args[1]()).toEqual(compareModel);
            });

            it("validates selection types using policy", () => {
                let mockDomainObj = jasmine.createSpyObj(
                        'domainObject',
                        ['getCapability']
                    ),
                    mockOtherType = jasmine.createSpyObj(
                        'otherType',
                        ['getKey']
                    ),
                    //Create a form structure with location
                    structure = wizard.getFormStructure(true),
                    sections = structure.sections,
                    rows = structure.sections[sections.length - 1].rows,
                    locationRow = rows[rows.length - 1];

                mockDomainObj.getCapability.andReturn(mockOtherType);
                locationRow.validate(mockDomainObj);

                // Should check policy to see if the user-selected location
                // can actually contain objects of this type
                expect(mockPolicyService.allow).toHaveBeenCalledWith(
                    'composition',
                    mockOtherType,
                    mockType
                );
            });

            it("creates a form model without a location if not requested", () => {
                expect(wizard.getFormStructure(false).sections.some( (section) => {
                    return section.name === 'Location';
                })).toEqual(false);
            });


        });
    }
);
