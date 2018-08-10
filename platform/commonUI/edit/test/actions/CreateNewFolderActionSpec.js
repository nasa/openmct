/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    ['../../src/actions/CreateNewFolderAction'],
    function (CreateNewFolderAction) {

        describe("The Create New Folder Action", function () {
            var mockDomainObject,
                mockNewObject,
                mockType,
                testModel,
                mockFolderName,
                mockTypeService,
                mockActionContext,
                mockCompositionCapability,
                action;
            
            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getCapability",
                        "useCapability",
                        "hasCapability",
                        "getId"
                    ]
                );
                
                mockNewObject = jasmine.createSpyObj(
                    "newObject",
                    [
                        "getCapability",
                        "useCapability",
                        "hasCapability",
                        "getId"
                    ]
                );
                
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getInitialModel"
                    ]
                );
                
                testModel = { 
                                type: mockType,
                                name: "Name",
                                location: "someLocation"
                            };
                
                mockFolderName = "Name";
                
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    ["getType"]
                );    
                
                mockActionContext = { domainObject: mockDomainObject };
                
                mockCompositionCapability = jasmine.createSpyObj(
                    "composition",
                    ["add"]
                );
                
                mockType.getKey.and.returnValue("test");
                mockType.getInitialModel.and.returnValue(testModel);
                mockDomainObject.getCapability.and.callFake(function (capability) {
                    return (capability === 'composition') && mockCompositionCapability;
                });
                mockDomainObject.hasCapability.and.returnValue(true);
                mockCompositionCapability.add.and.returnValue(mockPromise(true));
                mockDomainObject.useCapability.and.callFake(function (capability) {
                    return (capability === 'instantiation') && mockNewObject;
                });
                mockTypeService.getType.and.returnValue(mockType);
                mockDomainObject.getId.and.returnValue("id");
                
                action = new CreateNewFolderAction(mockTypeService, mockActionContext);
            });

            it("uses the instantiation capability when performed", function () {
                action.perform(mockFolderName);
                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith("instantiation", jasmine.any(Object));
            });

            it("adds new objects to the parent's composition", function () {
                action.perform(mockFolderName);
                expect(mockDomainObject.getCapability).toHaveBeenCalledWith("composition");
                expect(mockCompositionCapability.add).toHaveBeenCalled();
            });

            it("is only applicable when a domain object is in context", function () {
                expect(CreateNewFolderAction.appliesTo(mockActionContext)).toBeTruthy();
                expect(CreateNewFolderAction.appliesTo({})).toBeFalsy();
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith('editor');
            });
            
        });
    }
);

