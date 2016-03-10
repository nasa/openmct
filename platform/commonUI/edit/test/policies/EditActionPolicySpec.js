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
    ["../../src/policies/EditActionPolicy"],
    function (EditActionPolicy) {
        "use strict";

        describe("The Edit action policy", function () {
            var editableView,
                nonEditableView,
                undefinedView,
                testViews,
                testContext,
                mockDomainObject,
                mockEditAction,
                mockPropertiesAction,
                policy;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'useCapability' ]
                );
                mockEditAction = jasmine.createSpyObj('edit', ['getMetadata']);
                mockPropertiesAction = jasmine.createSpyObj('edit', ['getMetadata']);

                editableView = { editable: true };
                nonEditableView = { editable: false };
                undefinedView = { someKey: "some value" };
                testViews = [];

                mockDomainObject.useCapability.andCallFake(function (c) {
                    // Provide test views, only for the view capability
                    return c === 'view' && testViews;
                });

                mockEditAction.getMetadata.andReturn({ key: 'edit' });
                mockPropertiesAction.getMetadata.andReturn({ key: 'properties' });

                testContext = {
                    domainObject: mockDomainObject,
                    category: 'view-control'
                };

                policy = new EditActionPolicy();
            });

            //TODO: Disabled for NEM Beta
            xit("allows the edit action when there are editable views", function () {
                testViews = [ editableView ];
                expect(policy.allow(mockEditAction, testContext)).toBeTruthy();
                // No edit flag defined; should be treated as editable
                testViews = [ undefinedView, undefinedView ];
                expect(policy.allow(mockEditAction, testContext)).toBeTruthy();
            });

            //TODO: Disabled for NEM Beta
            xit("allows the edit properties action when there are no editable views", function () {
                testViews = [ nonEditableView, nonEditableView ];
                expect(policy.allow(mockPropertiesAction, testContext)).toBeTruthy();
            });

            //TODO: Disabled for NEM Beta
            xit("disallows the edit action when there are no editable views", function () {
                testViews = [ nonEditableView, nonEditableView ];
                expect(policy.allow(mockEditAction, testContext)).toBeFalsy();
            });

            //TODO: Disabled for NEM Beta
            xit("disallows the edit properties action when there are" +
                " editable views", function () {
                testViews = [ editableView ];
                expect(policy.allow(mockPropertiesAction, testContext)).toBeFalsy();
            });

            it("allows the edit properties outside of the 'view-control' category", function () {
                testViews = [ nonEditableView ];
                testContext.category = "something-else";
                expect(policy.allow(mockPropertiesAction, testContext)).toBeTruthy();
            });
        });
    }
);