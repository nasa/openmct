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
    [
        "../../src/actions/EditAction"
    ],
    function (EditAction) {
        "use strict";

        describe("The Edit action", function () {
            var mockNavigationService,
                mockLog,
                mockDomainObject,
                mockStatusCapability,
                mockType,
                actionContext,
                mockCapabilities,
                mockQ,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {

                mockStatusCapability = jasmine.createSpyObj(
                    "statusCapability",
                    [ "get", "set" ]
                );

                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [ "setNavigation", "getNavigation" ]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    [ "error", "warn", "info", "debug" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability", "hasCapability" ]
                );
                mockType = jasmine.createSpyObj(
                    "type",
                    [ "hasFeature" ]
                );

                mockQ = jasmine.createSpyObj(
                    "q",
                    [ "when", "all" ]
                );

                mockQ.when.andReturn(function(value){
                    return mockPromise(value);
                });

                mockQ.all.andReturn(mockPromise(undefined));

                mockDomainObject.getCapability.andCallFake(function(capability){
                    return mockCapabilities[capability];
                });
                mockDomainObject.getModel.andReturn({});
                mockDomainObject.getId.andReturn("testId");
                mockStatusCapability.get.andReturn(false);
                mockType.hasFeature.andReturn(true);

                mockCapabilities = {
                    "status": mockStatusCapability,
                    "type": mockType
                };

                actionContext = { domainObject: mockDomainObject };

                action = new EditAction(
                    mockQ,
                    mockNavigationService,
                    mockLog,
                    actionContext
                );
            });

            it("is only applicable when a domain object is present", function () {
                expect(EditAction.appliesTo(actionContext)).toBeTruthy();
                expect(EditAction.appliesTo({})).toBeFalsy();
                // Should have checked for creatability
                expect(mockType.hasFeature).toHaveBeenCalledWith('creation');
            });

            it("is only applicable when domain object is not in edit mode", function () {
                // Indicates whether object is in edit mode
                mockStatusCapability.get.andReturn(false);
                expect(EditAction.appliesTo(actionContext)).toBeTruthy();
                mockStatusCapability.get.andReturn(true);
                expect(EditAction.appliesTo(actionContext)).toBeFalsy();
            });

            it("navigates to editable domain object", function () {
                spyOn(action, 'createEditableObject');

                action.perform();

                expect(mockNavigationService.setNavigation).toHaveBeenCalled();
                expect(action.createEditableObject).toHaveBeenCalled();
            });

            it("ensures that the edited object is navigated-to", function () {
                var navigatedObject;
                action.perform();
                navigatedObject = mockNavigationService.setNavigation.mostRecentCall.args[0];
                expect(navigatedObject.getId())
                    .toEqual(mockDomainObject.getId());
                expect(navigatedObject).not.toBe(mockDomainObject);
            });

            it("logs a warning if constructed when inapplicable", function () {
                // Verify precondition (ensure warn wasn't called during setup)
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Should not have hit an exception...
                new EditAction(
                    mockQ,
                    mockNavigationService,
                    mockLog,
                    {}
                ).perform();

                // ...but should have logged a warning
                expect(mockLog.warn).toHaveBeenCalled();

                // And should not have had other interactions
                expect(mockNavigationService.setNavigation)
                    .not.toHaveBeenCalled();
            });



        });
    }
);