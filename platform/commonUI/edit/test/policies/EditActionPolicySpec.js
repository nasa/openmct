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
    ["../../src/policies/EditActionPolicy"],
    function (EditActionPolicy) {

        describe("The Edit action policy", function () {
            var editableView,
                nonEditableView,
                undefinedView,
                testViews,
                testContext,
                mockDomainObject,
                mockEditAction,
                mockPropertiesAction,
                mockTypeCapability,
                mockEditorCapability,
                capabilities,
                plotView,
                policy;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [
                        'useCapability',
                        'hasCapability',
                        'getCapability'
                    ]
                );
                mockEditorCapability = jasmine.createSpyObj('editorCapability', ['isEditContextRoot']);
                mockTypeCapability = jasmine.createSpyObj('type', ['getKey']);
                capabilities = {
                    'editor': mockEditorCapability,
                    'type': mockTypeCapability
                };

                mockEditAction = jasmine.createSpyObj('edit', ['getMetadata']);
                mockPropertiesAction = jasmine.createSpyObj('edit', ['getMetadata']);

                mockDomainObject.getCapability.and.callFake(function (capability) {
                    return capabilities[capability];
                });
                mockDomainObject.hasCapability.and.callFake(function (capability) {
                    return !!capabilities[capability];
                });

                editableView = { editable: true };
                nonEditableView = { editable: false };
                undefinedView = { someKey: "some value" };
                plotView = { key: "plot", editable: false };
                testViews = [];

                mockDomainObject.useCapability.and.callFake(function (c) {
                    // Provide test views, only for the view capability
                    return c === 'view' && testViews;
                });

                mockEditAction.getMetadata.and.returnValue({ key: 'edit' });
                mockPropertiesAction.getMetadata.and.returnValue({ key: 'properties' });

                testContext = {
                    domainObject: mockDomainObject,
                    category: 'view-control'
                };

                policy = new EditActionPolicy();
            });

            it("allows the edit action when there are editable views", function () {
                testViews = [editableView];
                expect(policy.allow(mockEditAction, testContext)).toBe(true);
            });

            it("allows the edit properties action when there are no editable views", function () {
                testViews = [nonEditableView, nonEditableView];
                expect(policy.allow(mockPropertiesAction, testContext)).toBe(true);
            });

            it("disallows the edit action when there are no editable views", function () {
                testViews = [nonEditableView, nonEditableView];
                expect(policy.allow(mockEditAction, testContext)).toBe(false);
            });

            it("disallows the edit properties action when there are" +
                " editable views", function () {
                testViews = [editableView];
                expect(policy.allow(mockPropertiesAction, testContext)).toBe(false);
            });

            it("disallows the edit action when object is already being" +
                " edited", function () {
                testViews = [editableView];
                mockEditorCapability.isEditContextRoot.and.returnValue(true);
                expect(policy.allow(mockEditAction, testContext)).toBe(false);
            });

            it("allows editing of panels in plot view", function () {
                testViews = [plotView];
                mockTypeCapability.getKey.and.returnValue('telemetry.panel');

                expect(policy.allow(mockEditAction, testContext)).toBe(true);
            });

            it("disallows editing of plot view when object not a panel type", function () {
                testViews = [plotView];
                mockTypeCapability.getKey.and.returnValue('something.else');

                expect(policy.allow(mockEditAction, testContext)).toBe(false);
            });


            it("allows the edit properties outside of the 'view-control' category", function () {
                testViews = [nonEditableView];
                testContext.category = "something-else";
                expect(policy.allow(mockPropertiesAction, testContext)).toBe(true);
            });
        });
    }
);
