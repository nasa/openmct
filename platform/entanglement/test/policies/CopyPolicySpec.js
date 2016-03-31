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

/*global define,describe,beforeEach,it,jasmine,expect,spyOn */
define([
    '../../src/policies/CopyPolicy',
    '../DomainObjectFactory'
], function (CopyPolicy, domainObjectFactory) {
    'use strict';

    describe("CopyPolicy", function () {
        var testMetadata,
            testContext,
            mockDomainObject,
            mockType,
            mockAction,
            policy;

        beforeEach(function () {
            mockType =
                jasmine.createSpyObj('type', ['hasFeature']);

            testMetadata = {};

            mockDomainObject = domainObjectFactory({
                capabilities: { type: mockType }
            });

            mockType.hasFeature.andCallFake(function (feature) {
                return feature === 'creation';
            });

            mockAction = jasmine.createSpyObj('action', ['getMetadata']);
            mockAction.getMetadata.andReturn(testMetadata);

            testContext = { domainObject: mockDomainObject };

            policy = new CopyPolicy();
        });

        describe("for copy actions", function () {
            beforeEach(function () {
                testMetadata.key = 'copy';
            });

            describe("when an object is non-creatable", function () {
                beforeEach(function () {
                    mockType.hasFeature.andReturn(false);
                });

                it("disallows the action", function () {
                    expect(policy.allow(mockAction, testContext)).toBe(false);
                });
            });

            describe("when an object is creatable", function () {
                it("allows the action", function () {
                    expect(policy.allow(mockAction, testContext)).toBe(true);
                });
            });
        });

        describe("for other actions", function () {
            beforeEach(function () {
                testMetadata.key = 'foo';
            });

            it("simply allows the action", function () {
                expect(policy.allow(mockAction, testContext)).toBe(true);
                mockType.hasFeature.andReturn(false);
                expect(policy.allow(mockAction, testContext)).toBe(true);
            });
        });
    });
});
