/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,describe,it,expect,beforeEach,jasmine,spyOn*/

define(
    ["../../src/actions/RemoveAction"],
    function (RemoveAction) {
        "use strict";

        describe("The Remove action", function () {
            var mockQ,
                mockNavigationService,
                mockDomainObject,
                mockParent,
                mockChildObject,
                mockGrandchildObject,
                mockRootObject,
                mockContext,
                mockChildContext,
                mockGrandchildContext,
                mockRootContext,
                mockMutation,
                mockPersistence,
                mockType,
                actionContext,
                model,
                capabilities,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {


                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability" ]
                );
                mockChildObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability" ]
                );
                mockGrandchildObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability" ]
                );
                mockRootObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability" ]
                );
                mockQ = { when: mockPromise };
                mockParent = {
                    getModel: function () {
                        return model;
                    },
                    getCapability: function (k) {
                        return capabilities[k];
                    },
                    useCapability: function (k, v) {
                        return capabilities[k].invoke(v);
                    }
                };
                mockContext = jasmine.createSpyObj("context", [ "getParent" ]);
                mockChildContext = jasmine.createSpyObj("context", [ "getParent" ]);
                mockGrandchildContext = jasmine.createSpyObj("context", [ "getParent" ]);
                mockRootContext = jasmine.createSpyObj("context", [ "getParent" ]);
                mockMutation = jasmine.createSpyObj("mutation", [ "invoke" ]);
                mockPersistence = jasmine.createSpyObj("persistence", [ "persist" ]);
                mockType = jasmine.createSpyObj("type", [ "hasFeature" ]);
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [
                        "getNavigation",
                        "setNavigation",
                        "addListener",
                        "removeListener"
                    ]
                );
                mockNavigationService.getNavigation.andReturn(mockDomainObject);
                
                
                mockDomainObject.getId.andReturn("test");
                mockDomainObject.getCapability.andReturn(mockContext);
                mockContext.getParent.andReturn(mockParent);
                mockType.hasFeature.andReturn(true);

                capabilities = {
                    mutation: mockMutation,
                    persistence: mockPersistence,
                    type: mockType
                };
                model = {
                    composition: [ "a", "test", "b" ]
                };

                actionContext = { domainObject: mockDomainObject };

                action = new RemoveAction(mockQ, mockNavigationService, actionContext);
            });

            it("only applies to objects with parents", function () {
                expect(RemoveAction.appliesTo(actionContext)).toBeTruthy();

                mockContext.getParent.andReturn(undefined);

                expect(RemoveAction.appliesTo(actionContext)).toBeFalsy();

                // Also verify that creatability was checked
                expect(mockType.hasFeature).toHaveBeenCalledWith('creation');
            });

            it("mutates the parent when performed", function () {
                action.perform();
                expect(mockMutation.invoke)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("changes composition from its mutation function", function () {
                var mutator, result;
                action.perform();
                mutator = mockMutation.invoke.mostRecentCall.args[0];
                result = mutator(model);

                // Should not have cancelled the mutation
                expect(result).not.toBe(false);

                // Simulate mutate's behavior (remove can either return a
                // new model or modify this one in-place)
                result = result || model;

                // Should have removed "test" - that was our
                // mock domain object's id.
                expect(result.composition).toEqual(["a", "b"]);

                // Finally, should have persisted
                expect(mockPersistence.persist).toHaveBeenCalled();
            });
            
            it("removes parent of object currently navigated to", function () {
                // Navigates to child object
                mockNavigationService.getNavigation.andReturn(mockChildObject);
                
                // Test is id of object being removed
                // Child object has different id
                mockDomainObject.getId.andReturn("test");
                mockChildObject.getId.andReturn("not test");
                
                // Sets context for the child and domainObject
                mockDomainObject.getCapability.andReturn(mockContext);
                mockChildObject.getCapability.andReturn(mockChildContext);
                
                // Parents of child and domainObject are set
                mockContext.getParent.andReturn(mockParent);
                mockChildContext.getParent.andReturn(mockDomainObject);
                
                mockType.hasFeature.andReturn(true);
                
                action.perform();
                
                // Expects navigation to parent of domainObject (removed object)
                expect(mockNavigationService.setNavigation).toHaveBeenCalledWith(mockParent);
            });
            
            it("checks if removing object not in ascendent path (reaches ROOT)", function () {
                // Navigates to grandchild of ROOT
                mockNavigationService.getNavigation.andReturn(mockGrandchildObject);
                
                // domainObject (grandparent) is set as ROOT, child and grandchild
                // are set objects not being removed
                mockDomainObject.getId.andReturn("test 1");
                mockRootObject.getId.andReturn("ROOT");
                mockChildObject.getId.andReturn("not test 2");
                mockGrandchildObject.getId.andReturn("not test 3");
                
                // Sets context for the grandchild, child, and domainObject
                mockRootObject.getCapability.andReturn(mockRootContext);
                mockChildObject.getCapability.andReturn(mockChildContext);
                mockGrandchildObject.getCapability.andReturn(mockGrandchildContext);
                
                // Parents of grandchild and child are set
                mockChildContext.getParent.andReturn(mockRootObject);
                mockGrandchildContext.getParent.andReturn(mockChildObject);
                
                mockType.hasFeature.andReturn(true);
                
                action.perform();
                
                // Expects no navigation to occur
                expect(mockNavigationService.setNavigation).not.toHaveBeenCalled();
            });

        });
    }
);