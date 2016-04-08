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
    '../../src/policies/MovePolicy',
    '../DomainObjectFactory'
], function (MovePolicy, domainObjectFactory) {
    'use strict';

    describe("MovePolicy", function () {
        var testMetadata,
            testContext,
            mockDomainObject,
            mockParent,
            mockParentType,
            mockType,
            mockAction,
            policy;

        beforeEach(function () {
            var mockContextCapability =
                    jasmine.createSpyObj('context', ['getParent']);

            mockType =
                jasmine.createSpyObj('type', ['hasFeature']);
            mockParentType =
                jasmine.createSpyObj('parent-type', ['hasFeature']);


            testMetadata = {};

            mockDomainObject = domainObjectFactory({
                capabilities: {
                    context: mockContextCapability,
                    type: mockType
                }
            });
            mockParent = domainObjectFactory({
                capabilities: {
                    type: mockParentType
                }
            });

            mockContextCapability.getParent.andReturn(mockParent);

            mockType.hasFeature.andCallFake(function (feature) {
                return feature === 'creation';
            });
            mockParentType.hasFeature.andCallFake(function (feature) {
                return feature === 'creation';
            });

            mockAction = jasmine.createSpyObj('action', ['getMetadata']);
            mockAction.getMetadata.andReturn(testMetadata);

            testContext = { domainObject: mockDomainObject };

            policy = new MovePolicy();
        });

        describe("for move actions", function () {
            beforeEach(function () {
                testMetadata.key = 'move';
            });

            describe("when an object is non-modifiable", function () {
                beforeEach(function () {
                    mockType.hasFeature.andReturn(false);
                });

                it("disallows the action", function () {
                    expect(policy.allow(mockAction, testContext)).toBe(false);
                });
            });

            describe("when a parent is non-modifiable", function () {
                beforeEach(function () {
                    mockParentType.hasFeature.andReturn(false);
                });

                it("disallows the action", function () {
                    expect(policy.allow(mockAction, testContext)).toBe(false);
                });
            });

            describe("when an object and its parent are modifiable", function () {
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
                mockParentType.hasFeature.andReturn(false);
                expect(policy.allow(mockAction, testContext)).toBe(true);
            });
        });
    });
});
