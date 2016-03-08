/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/actions/ExportTimelineAsCSVAction'],
    function (ExportTimelineAsCSVAction) {
        describe("ExportTimelineAsCSVAction", function () {
            var mockDomainObject,
                mockType,
                testContext,
                testType,
                action;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getModel', 'getCapability', 'hasCapability' ]
                );
                mockType = jasmine.createSpyObj('type', [ 'instanceOf' ]);

                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andReturn(mockType);
                mockType.instanceOf.andCallFake(function (type) {
                    return type === testType;
                });

                testContext = { domainObject: mockDomainObject };
            });

            it("is applicable to timelines", function () {
                testType = 'timeline';
                expect(ExportTimelineAsCSVAction.appliesTo(testContext))
                    .toBe(true);
            });

            it("is not applicable to non-timelines", function () {
                testType = 'folder';
                expect(ExportTimelineAsCSVAction.appliesTo(testContext))
                    .toBe(false);
            });
        });
    }
);