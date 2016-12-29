/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
    ["../../src/policies/PlotViewPolicy"],
    (PlotViewPolicy) => {

        describe("Plot view policy", () => {
            let testView,
                mockDomainObject,
                mockTelemetry,
                testMetadata,
                policy;

            beforeEach(() => {
                testView = { key: "plot" };
                testMetadata = {};
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getModel', 'getCapability']
                );
                mockTelemetry = jasmine.createSpyObj(
                    'telemetry',
                    ['getMetadata']
                );
                mockDomainObject.getCapability.andCallFake( (c) => {
                    return c === 'telemetry' ? mockTelemetry : undefined;
                });
                mockTelemetry.getMetadata.andReturn(testMetadata);

                policy = new PlotViewPolicy();
            });

            it("allows the imagery view for domain objects with numeric telemetry", () => {
                testMetadata.ranges = [{ key: "foo", format: "number" }];
                expect(policy.allow(testView, mockDomainObject)).toBeTruthy();
            });

            it("allows the imagery view for domain objects with unspecified telemetry", () => {
                testMetadata.ranges = [{ key: "foo"  }];
                expect(policy.allow(testView, mockDomainObject)).toBeTruthy();
            });

            it("disallows the imagery view for domain objects without image telemetry", () => {
                testMetadata.ranges = [{ key: "foo", format: "somethingElse" }];
                expect(policy.allow(testView, mockDomainObject)).toBeFalsy();
            });

            it("allows other views", () => {
                testView.key = "somethingElse";
                testMetadata.ranges = [{ key: "foo", format: "somethingElse" }];
                expect(policy.allow(testView, mockDomainObject)).toBeTruthy();
            });

        });
    }
);

