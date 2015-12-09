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
/*global define,describe,it,expect,beforeEach,jasmine,xit,xdescribe*/

define(
    ["../../src/actions/EditAction"],
    function (EditAction) {
        "use strict";

        describe("The Edit action", function () {
            var mockLocation,
                mockNavigationService,
                mockLog,
                mockDomainObject,
                mockType,
                actionContext,
                action;

            beforeEach(function () {
                mockLocation = jasmine.createSpyObj(
                    "$location",
                    [ "path" ]
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
                    [ "getId", "getModel", "getCapability" ]
                );
                mockType = jasmine.createSpyObj(
                    "type",
                    [ "hasFeature" ]
                );

                mockDomainObject.getCapability.andReturn(mockType);
                mockType.hasFeature.andReturn(true);

                actionContext = { domainObject: mockDomainObject };

                action = new EditAction(
                    mockLocation,
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

            //TODO: Disabled for NEM Beta
            xit("changes URL path to edit mode when performed", function () {
                action.perform();
                expect(mockLocation.path).toHaveBeenCalledWith("/edit");
            });

            //TODO: Disabled for NEM Beta
            xit("ensures that the edited object is navigated-to", function () {
                action.perform();
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            //TODO: Disabled for NEM Beta
            xit("logs a warning if constructed when inapplicable", function () {
                // Verify precondition (ensure warn wasn't called during setup)
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Should not have hit an exception...
                new EditAction(
                    mockLocation,
                    mockNavigationService,
                    mockLog,
                    {}
                ).perform();

                // ...but should have logged a warning
                expect(mockLog.warn).toHaveBeenCalled();

                // And should not have had other interactions
                expect(mockLocation.path)
                    .not.toHaveBeenCalled();
                expect(mockNavigationService.setNavigation)
                    .not.toHaveBeenCalled();
            });



        });
    }
);