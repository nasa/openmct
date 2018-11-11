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
/*global describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/policies/EditContextualActionPolicy"],
    function (EditContextualActionPolicy) {

        describe("The Edit contextual action policy", function () {
            var policy,
                navigationService,
                mockAction,
                context,
                navigatedObject,
                mockDomainObject,
                mockEditorCapability,
                metadata,
                editModeBlacklist = ["copy", "follow", "window", "link", "locate"],
                nonEditContextBlacklist = ["copy", "follow", "properties", "move", "link", "remove", "locate"];

            beforeEach(function () {
                mockEditorCapability = jasmine.createSpyObj("editorCapability", ["isEditContextRoot", "inEditContext"]);

                navigatedObject = jasmine.createSpyObj("navigatedObject", ["hasCapability", "getCapability"]);
                navigatedObject.getCapability.and.returnValue(mockEditorCapability);
                navigatedObject.hasCapability.and.returnValue(false);


                mockDomainObject = jasmine.createSpyObj("domainObject", ["hasCapability", "getCapability"]);
                mockDomainObject.hasCapability.and.returnValue(false);
                mockDomainObject.getCapability.and.returnValue(mockEditorCapability);

                navigationService = jasmine.createSpyObj("navigationService", ["getNavigation"]);
                navigationService.getNavigation.and.returnValue(navigatedObject);

                metadata = {key: "move"};
                mockAction = jasmine.createSpyObj("action", ["getMetadata"]);
                mockAction.getMetadata.and.returnValue(metadata);

                context = {domainObject: mockDomainObject};

                policy = new EditContextualActionPolicy(navigationService, editModeBlacklist, nonEditContextBlacklist);
            });

            it('Allows all actions when navigated object not in edit mode', function () {
                expect(policy.allow(mockAction, context)).toBe(true);
            });

            it('Allows "window" action when navigated object in edit mode,' +
                ' but selected object not in edit mode ', function () {
                navigatedObject.hasCapability.and.returnValue(true);
                mockEditorCapability.isEditContextRoot.and.returnValue(true);
                metadata.key = "window";
                expect(policy.allow(mockAction, context)).toBe(true);
            });

            it('Allows "remove" action when navigated object in edit mode,' +
                ' and selected object not editable, but its parent is.',
                function () {
                    var mockParent = jasmine.createSpyObj("parentObject", ["hasCapability"]),
                        mockContextCapability = jasmine.createSpyObj("contextCapability", ["getParent"]);

                    mockParent.hasCapability.and.returnValue(true);
                    mockContextCapability.getParent.and.returnValue(mockParent);
                    navigatedObject.hasCapability.and.returnValue(true);

                    mockDomainObject.getCapability.and.returnValue(mockContextCapability);
                    mockDomainObject.hasCapability.and.callFake(function (capability) {
                        switch (capability) {
                            case "editor": return false;
                            case "context": return true;
                        }
                    });
                    metadata.key = "remove";

                    expect(policy.allow(mockAction, context)).toBe(true);
                });

            it('Disallows "move" action when navigated object in edit mode,' +
                ' but selected object not in edit mode ', function () {
                navigatedObject.hasCapability.and.returnValue(true);
                mockEditorCapability.isEditContextRoot.and.returnValue(true);
                mockEditorCapability.inEditContext.and.returnValue(false);
                metadata.key = "move";
                expect(policy.allow(mockAction, context)).toBe(false);
            });

            it('Disallows copy action when navigated object and' +
                ' selected object in edit mode', function () {
                navigatedObject.hasCapability.and.returnValue(true);
                mockDomainObject.hasCapability.and.returnValue(true);
                mockEditorCapability.isEditContextRoot.and.returnValue(true);
                mockEditorCapability.inEditContext.and.returnValue(true);

                metadata.key = "copy";
                expect(policy.allow(mockAction, context)).toBe(false);
            });

        });
    }
);
