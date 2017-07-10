/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

define(
    [
        '../../src/actions/CopyActionWizard',
    ],
    function (CopyActionWizard) {

        describe("Copy Action Wizard", function () {
            var copyActionWizard,
                mockDomainObject,
                mockParent,
                mockValidator,
                mockType,
                mockProperties,
                mockModel;

            beforeEach(function () {
                mockParent = {
                    name: "mock parent"
                };

                mockModel = {
                    name: "mock model"
                };

                mockProperties = [
                    {
                        getDefinition: function () {
                            return { name: "property 1 definition", control: undefined };
                        },

                        getValue: function (model) {
                            return "property 1 value";
                        }
                    },
                    {
                        getDefinition: function () {
                            return { name: "property 2 definition", control: {} };
                        },

                        getValue: function (model) {
                            return "property 2 value";
                        }
                    }
                ];

                mockType = jasmine.createSpyObj("mockType", ["getProperties"]);
                mockType.getProperties.andReturn(mockProperties);

                mockDomainObject = jasmine.createSpyObj('mockDomainObject',
                    ["getCapability", "getModel"]);

                mockDomainObject.getCapability.andCallFake(function (capability) {
                    if (capability === "type") {
                        return mockType;
                    }
                    return undefined;
                });

                mockDomainObject.getModel.andReturn(mockModel);

                mockValidator = function () {
                    return true;
                };

                copyActionWizard = new CopyActionWizard(
                    mockDomainObject,
                    mockParent,
                    mockValidator
                );
            });

            it("initializes successfully", function () {
                expect(copyActionWizard).toBeDefined();
            });

            it("creates the expected form structure", function () {
                var form = copyActionWizard.getFormStructure();
                expect(form.sections).toBeDefined();
                expect(form.sections.length).toBe(2);

                expect(form.sections[0].name).toBe("Properties");
                expect(form.sections[0].rows.length).toBe(1);
                expect(form.sections[0].rows[0].name).toBe("property 2 definition");

                expect(form.sections[1].name).toBe("Location");
                expect(form.sections[1].rows.length).toBe(1);
                expect(form.sections[1].rows[0].name).toBe("Duplicate To");
                expect(form.sections[1].rows[0].validate).toBe(mockValidator);
                expect(form.sections[1].rows[0].control).toBe("locator");
                expect(form.sections[1].rows[0].key).toBe("location");

                expect(form.name).toBe("Duplicate " + mockModel.name + " To a Location");
            });

            it("populates initial data accordingly", function () {
                var value = copyActionWizard.getInitialFormValue();
                expect(value[0]).toBe("property 1 value");
                expect(value[1]).toBe("property 2 value");
                expect(value.location).toBe(mockParent);
            });
        });
    }
);
