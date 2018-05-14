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

define(
    ["../src/CompositionPolicy"],
    function (CompositionPolicy) {
        describe("Composition policy", function () {
            var mockParentObject,
                typeA,
                typeB,
                typeC,
                mockChildObject,
                policy;

            beforeEach(function () {
                mockParentObject = jasmine.createSpyObj('domainObject', [
                    'getCapability'
                ]);

                typeA = jasmine.createSpyObj(
                    'type A-- the particular kind',
                    ['getKey', 'getDefinition']
                );
                typeA.getKey.andReturn('a');
                typeA.getDefinition.andReturn({
                    contains: ['a']
                });


                typeB = jasmine.createSpyObj(
                    'type B-- anything goes',
                    ['getKey', 'getDefinition']
                );
                typeB.getKey.andReturn('b');
                typeB.getDefinition.andReturn({
                    contains: ['a', 'b']
                });

                typeC = jasmine.createSpyObj(
                    'type C-- distinguishing and interested in telemetry',
                    ['getKey', 'getDefinition']
                );
                typeC.getKey.andReturn('c');
                typeC.getDefinition.andReturn({
                    contains: [{has: 'telemetry'}]
                });

                mockChildObject = jasmine.createSpyObj(
                    'childObject',
                    ['getCapability', 'hasCapability']
                );

                policy = new CompositionPolicy();
            });

            describe('enforces simple containment rules', function () {

                it('allows when type matches', function () {
                    mockParentObject.getCapability.andReturn(typeA);

                    mockChildObject.getCapability.andReturn(typeA);
                    expect(policy.allow(mockParentObject, mockChildObject))
                        .toBeTruthy();

                    mockParentObject.getCapability.andReturn(typeB);
                    expect(policy.allow(mockParentObject, mockChildObject))
                        .toBeTruthy();

                    mockChildObject.getCapability.andReturn(typeB);
                    expect(policy.allow(mockParentObject, mockChildObject))
                        .toBeTruthy();
                });


                it('disallows when type doesn\'t match', function () {

                    mockParentObject.getCapability.andReturn(typeA);
                    mockChildObject.getCapability.andReturn(typeB);
                    expect(policy.allow(mockParentObject, mockChildObject))
                        .toBeFalsy();

                    mockChildObject.getCapability.andReturn(typeC);
                    expect(policy.allow(mockParentObject, mockChildObject))
                        .toBeFalsy();
                });

            });

            describe('enforces capability-based containment rules', function () {
                it('allows when object has capability', function () {
                    mockParentObject.getCapability.andReturn(typeC);

                    mockChildObject.hasCapability.andReturn(true);
                    expect(policy.allow(mockParentObject, mockChildObject))
                        .toBeTruthy();
                    expect(mockChildObject.hasCapability)
                        .toHaveBeenCalledWith('telemetry');
                });

                it('skips when object doesn\'t have capability', function () {
                    mockChildObject.hasCapability.andReturn(false);

                    mockParentObject.getCapability.andReturn(typeC);

                    expect(policy.allow(mockParentObject, mockChildObject))
                        .toBeFalsy();
                    expect(mockChildObject.hasCapability)
                        .toHaveBeenCalledWith('telemetry');
                });
            });

        });
    }
);
