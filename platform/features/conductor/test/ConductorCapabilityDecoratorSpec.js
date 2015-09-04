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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 *  EventSpec. Created by vwoeltje on 11/6/14. Modified by shale on 06/23/2015.
 */
define(
    ["../src/ConductorCapabilityDecorator"],
    function (ConductorCapabilityDecorator) {
        "use strict";

        describe("ConductorCapabilityDecorator", function () {
            var mockCapabilityService,
                mockConductorService,
                testModel,
                testCapabilities,
                decorator;

            function instantiate(Constructor) {
                return new Constructor();
            }

            beforeEach(function () {
                testCapabilities = {
                    telemetry: jasmine.createSpy('Telemetry'),
                    other: jasmine.createSpy('Other')
                };

                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    [ 'getCapabilities' ]
                );
                mockConductorService = jasmine.createSpyObj(
                    'conductorService',
                    [ 'getConductor' ]
                );
                testModel = { someKey: "some value" };

                mockCapabilityService.getCapabilities.andCallFake(function () {
                    // Wrap with object.create so we can still
                    // reliably expect properties of testCapabilities itself
                    return Object.create(testCapabilities);
                });

                decorator = new ConductorCapabilityDecorator(
                    mockConductorService,
                    mockCapabilityService
                );
            });

            it("delegates to the decorated capability service", function () {
                expect(mockCapabilityService.getCapabilities).not.toHaveBeenCalled();
                decorator.getCapabilities(testModel);
                expect(mockCapabilityService.getCapabilities).toHaveBeenCalled();
            });

            it("wraps the 'telemetry' capability of objects", function () {
                var capabilities = decorator.getCapabilities(testModel);
                expect(capabilities.telemetry)
                    .not.toBe(testCapabilities.telemetry);

                // Should wrap - verify by invocation
                expect(testCapabilities.telemetry).not.toHaveBeenCalled();
                instantiate(capabilities.telemetry);
                expect(testCapabilities.telemetry).toHaveBeenCalled();
            });

            it("does not wrap other capabilities", function () {
                var capabilities = decorator.getCapabilities(testModel);
                expect(capabilities.other)
                    .toBe(testCapabilities.other);
            });

            it("gets a time conductor from the conductorService", function () {
                expect(mockConductorService.getConductor).not.toHaveBeenCalled();
                instantiate(decorator.getCapabilities(testModel).telemetry);
                expect(mockConductorService.getConductor).toHaveBeenCalled();
            });
        });
    }
);
