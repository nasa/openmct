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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/policies/EditableViewPolicy"],
    function (EditableViewPolicy) {
        "use strict";

        describe("The editable view policy", function () {
            var testView,
                mockDomainObject,
                testMode,
                policy;

            beforeEach(function () {
                testMode = true; // Act as if we're in Edit mode by default
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['hasCapability']
                );
                mockDomainObject.hasCapability.andCallFake(function (c) {
                    return (c === 'editor') && testMode;
                });

                policy = new EditableViewPolicy();
            });

            it("disallows views in edit mode that are flagged as non-editable", function () {
                expect(policy.allow({ editable: false }, mockDomainObject))
                    .toBeFalsy();
            });

            it("allows views in edit mode that are flagged as editable", function () {
                expect(policy.allow({ editable: true }, mockDomainObject))
                    .toBeTruthy();
            });

            it("allows any view outside of edit mode", function () {
                var testViews = [
                    { editable: false },
                    { editable: true },
                    { someKey: "some value" }
                ];
                testMode = false; // Act as if we're not in Edit mode

                testViews.forEach(function (testView) {
                    expect(policy.allow(testView, mockDomainObject)).toBeTruthy();
                });
            });

            it("treats views with no defined 'editable' property as editable", function () {
                expect(policy.allow({ someKey: "some value" }, mockDomainObject))
                    .toBeTruthy();
            });
        });
    }
);