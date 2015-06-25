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

/**
 *  EventSpec. Created by shale on 06/24/2015.
 */
define(
    ["../../src/policies/MessagesViewPolicy"],
    function (MessagesViewPolicy) {
        "use strict";

        describe("The messages view policy", function () {
            var mockDomainObject,
                mockTelemetry,
                telemetryType,
                testType,
                testView,
                testMetadata,
                policy;

            beforeEach(function () {
                
                testView = { key: "string" };
                testMetadata = {};
                
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getModel', 'getCapability']
                );
                mockTelemetry = jasmine.createSpyObj(
                    'telemetry',
                    ['getMetadata']
                );
                
                mockDomainObject.getModel.andCallFake(function (c) {
                    return {type: testType};
                });
                mockDomainObject.getCapability.andCallFake(function (c) {
                    return c === 'telemetry' ? mockTelemetry : undefined;
                });
                mockTelemetry.getMetadata.andReturn(testMetadata);
                
                policy = new MessagesViewPolicy();
            });
            
            it("disallows the message view for objects without string telemetry", function () {
                testMetadata.ranges = [ { format: 'notString' } ];
                expect(policy.allow({ key: 'messages' }, mockDomainObject)).toBeFalsy();
            });

            it("allows the message view for objects with string telemetry", function () {
                testMetadata.ranges = [ { format: 'string' } ];
                expect(policy.allow({ key: 'messages' }, mockDomainObject)).toBeTruthy();
            });

            it("returns true when the current view is not the Messages view", function () {
                expect(policy.allow({ key: 'notMessages' }, mockDomainObject)).toBeTruthy();
            });
        });
    }
);