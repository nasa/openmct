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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine */

define(
    ['../src/EditableRegionPolicy'],
    function (EditableRegionPolicy) {
        "use strict";

        describe("The editable region policy ", function () {

            var editableRegionPolicy,
                mockDomainObject,
                mockStatusCapability,
                mockBrowseRegionPart = {
                    modes: 'browse'
                },
                mockEditRegionPart = {
                    modes: 'edit'
                },
                mockAllModesRegionPart = {};

            beforeEach(function(){
                editableRegionPolicy = new EditableRegionPolicy();

                mockStatusCapability = jasmine.createSpyObj("statusCapability", [
                   "get"
                ]);
                mockDomainObject = jasmine.createSpyObj("domainObject", [
                    "getCapability"
                ]);
                mockDomainObject.getCapability.andReturn(mockStatusCapability);
            });

            it("includes only browse region parts for object not in edit mode", function() {
                mockStatusCapability.get.andReturn(false);
                expect(editableRegionPolicy.allow(mockBrowseRegionPart, mockDomainObject)).toBe(true);
                expect(editableRegionPolicy.allow(mockEditRegionPart, mockDomainObject)).toBe(false);
            });

            it("includes only edit region parts for object in edit mode", function() {
                mockStatusCapability.get.andReturn(true);
                expect(editableRegionPolicy.allow(mockBrowseRegionPart, mockDomainObject)).toBe(false);
                expect(editableRegionPolicy.allow(mockEditRegionPart, mockDomainObject)).toBe(true);
            });

            it("includes region parts with no mode specification", function() {
                mockStatusCapability.get.andReturn(false);
                expect(editableRegionPolicy.allow(mockAllModesRegionPart, mockDomainObject)).toBe(true);
                mockStatusCapability.get.andReturn(true);
                expect(editableRegionPolicy.allow(mockAllModesRegionPart, mockDomainObject)).toBe(true);
            });

        });
    }
);
