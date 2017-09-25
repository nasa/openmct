/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    function (PlotViewPolicy) {

        describe("Plot view policy", function () {
            var testView,
                mockDomainObject,
                testAdaptedObject,
                openmct,
                telemetryMetadata,
                policy;

            beforeEach(function () {
                testView = { key: "plot" };
                testAdaptedObject = { telemetry: {} };
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['useCapability', 'hasCapability', 'getCapability']
                );
                mockDomainObject.useCapability.andReturn(testAdaptedObject);
                openmct = {
                    telemetry: jasmine.createSpyObj('telemetryAPI', [
                        'getMetadata'
                    ])
                };
                telemetryMetadata = jasmine.createSpyObj('telemetryMetadata', [
                    'valuesForHints'
                ]);
                telemetryMetadata.valuesForHints.andReturn([]);
                openmct.telemetry.getMetadata.andReturn(telemetryMetadata);
                policy = new PlotViewPolicy(openmct);
            });

            it('fetches metadata from telem api', function () {
                policy.allow(testView, mockDomainObject);
                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith('adapter');
                expect(openmct.telemetry.getMetadata)
                    .toHaveBeenCalledWith(testAdaptedObject);
                expect(telemetryMetadata.valuesForHints)
                    .toHaveBeenCalledWith(['range']);
            });

            it('returns false if no ranges exist', function () {
                telemetryMetadata.valuesForHints.andReturn([]);
                expect(policy.allow(testView, mockDomainObject)).toBe(false);
            });

            it('returns true if any ranges exist', function () {
                telemetryMetadata.valuesForHints.andReturn([{}]);
                expect(policy.allow(testView, mockDomainObject)).toBe(true);
            });

            it('returns false if all ranges are strings', function () {
                telemetryMetadata.valuesForHints.andReturn([{
                    format: 'string'
                }, {
                    format: 'string'
                }]);
                expect(policy.allow(testView, mockDomainObject)).toBe(false);
            });

            it('returns true if only some ranges are strings', function () {
                telemetryMetadata.valuesForHints.andReturn([{
                    format: 'string'
                }, {}]);
                expect(policy.allow(testView, mockDomainObject)).toBe(true);
            });

            it('returns true for telemetry delegators', function () {
                delete testAdaptedObject.telemetry;
                mockDomainObject.hasCapability.andCallFake(function (c) {
                    return c === 'delegation';
                });
                mockDomainObject.getCapability.andReturn(
                    jasmine.createSpyObj('delegation', [
                        'doesDelegateCapability'
                    ])
                );
                mockDomainObject.getCapability('delegation')
                    .doesDelegateCapability.andCallFake(function (c) {
                        return c === 'telemetry';
                    });
                expect(policy.allow(testView, mockDomainObject)).toBe(true);
                expect(openmct.telemetry.getMetadata).not.toHaveBeenCalled();
            });

            it('returns true for non-telemetry non-delegators', function () {
                delete testAdaptedObject.telemetry;
                mockDomainObject.hasCapability.andReturn(false);
                expect(policy.allow(testView, mockDomainObject)).toBe(false);
            });

            it("allows other views", function () {
                testView.key = "somethingElse";
                expect(policy.allow(testView, mockDomainObject)).toBe(true);
            });

        });
    }
);
