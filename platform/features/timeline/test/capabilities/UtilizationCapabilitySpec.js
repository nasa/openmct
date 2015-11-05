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
    ['../../src/capabilities/UtilizationCapability'],
    function (UtilizationCapability) {
        'use strict';

        describe("A Timeline's utilization capability", function () {
            var mockQ,
                mockDomainObject,
                testModel,
                testCapabilities,
                mockRelationship,
                mockComposition,
                mockCallback,
                capability;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return asPromise(callback(v));
                    },
                    testValue: v
                };
            }

            function allPromises(promises) {
                return asPromise(promises.map(function (p) {
                    return (p || {}).then ? p.testValue : p;
                }));
            }

            // Utility function for making domain objects with utilization
            // and/or cost capabilities
            function fakeDomainObject(resources, start, end, costs) {
                return {
                    getCapability: function (c) {
                        return ((c === 'utilization') && {
                            // Utilization capability
                            resources: function () {
                                return asPromise(resources);
                            },
                            invoke: function () {
                                return asPromise(resources.map(function (k) {
                                    return { key: k, start: start, end: end };
                                }));
                            }
                        }) || ((c === 'cost') && {
                            // Cost capability
                            resources: function () {
                                return Object.keys(costs).sort();
                            },
                            cost: function (c) {
                                return costs[c];
                            }
                        });
                    },
                    useCapability: function (c) {
                        return this.getCapability(c).invoke();
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getModel', 'getCapability', 'useCapability' ]
                );
                mockRelationship = jasmine.createSpyObj(
                    'relationship',
                    [ 'getRelatedObjects' ]
                );
                mockComposition = jasmine.createSpyObj(
                    'composition',
                    [ 'invoke' ]
                );
                mockCallback = jasmine.createSpy('callback');

                testModel = {
                    type: "activity",
                    resources: {
                        abc: 100,
                        xyz: 42
                    }
                };
                testCapabilities = {
                    composition: mockComposition,
                    relationship: mockRelationship
                };

                mockQ.when.andCallFake(asPromise);
                mockQ.all.andCallFake(allPromises);
                mockDomainObject.getModel.andReturn(testModel);
                mockDomainObject.getCapability.andCallFake(function (c) {
                    return testCapabilities[c];
                });
                mockDomainObject.useCapability.andCallFake(function (c) {
                    return testCapabilities[c] && testCapabilities[c].invoke();
                });

                capability = new UtilizationCapability(
                    mockQ,
                    mockDomainObject
                );
            });

            it("is applicable to timelines", function () {
                expect(UtilizationCapability.appliesTo({
                    type: "timeline"
                })).toBeTruthy();
            });

            it("is applicable to activities", function () {
                expect(UtilizationCapability.appliesTo(testModel))
                    .toBeTruthy();
            });

            it("is not applicable to other objects", function () {
                expect(UtilizationCapability.appliesTo({
                    type: "something"
                })).toBeFalsy();
            });

            it("accumulates resources from composition", function () {
                mockComposition.invoke.andReturn(asPromise([
                    fakeDomainObject(['abc', 'def']),
                    fakeDomainObject(['def', 'xyz']),
                    fakeDomainObject(['abc', 'xyz'])
                ]));

                capability.resources().then(mockCallback);

                expect(mockCallback)
                    .toHaveBeenCalledWith(['abc', 'def', 'xyz']);
            });

            it("accumulates utilizations from composition", function () {
                mockComposition.invoke.andReturn(asPromise([
                    fakeDomainObject(['abc', 'def'], 10, 100),
                    fakeDomainObject(['def', 'xyz'], 50, 90)
                ]));

                capability.invoke().then(mockCallback);

                expect(mockCallback).toHaveBeenCalledWith([
                    { key: 'abc', start: 10, end: 100 },
                    { key: 'def', start: 10, end: 100 },
                    { key: 'def', start: 50, end: 90 },
                    { key: 'xyz', start: 50, end: 90 }
                ]);
            });

            it("provides intrinsic utilization from related objects", function () {
                var mockTimespan = jasmine.createSpyObj(
                        'timespan',
                        ['getStart', 'getEnd', 'getEpoch']
                    ),
                    mockTimespanCapability = jasmine.createSpyObj(
                        'timespanCapability',
                        ['invoke']
                    );
                mockComposition.invoke.andReturn(asPromise([]));
                mockRelationship.getRelatedObjects.andReturn(asPromise([
                    fakeDomainObject([], 0, 0, { abc: 5, xyz: 15 })
                ]));

                testCapabilities.timespan = mockTimespanCapability;
                mockTimespanCapability.invoke.andReturn(asPromise(mockTimespan));
                mockTimespan.getStart.andReturn(42);
                mockTimespan.getEnd.andReturn(12321);
                mockTimespan.getEpoch.andReturn("TEST");

                capability.invoke().then(mockCallback);

                expect(mockCallback).toHaveBeenCalledWith([
                    { key: 'abc', start: 42, end: 12321, value: 5, epoch: "TEST" },
                    { key: 'xyz', start: 42, end: 12321, value: 15, epoch: "TEST" }
                ]);
            });

            it("provides resource keys from related objects", function () {
                mockComposition.invoke.andReturn(asPromise([]));
                mockRelationship.getRelatedObjects.andReturn(asPromise([
                    fakeDomainObject([], 0, 0, { abc: 5, xyz: 15 })
                ]));

                capability.resources().then(mockCallback);

                expect(mockCallback).toHaveBeenCalledWith(['abc', 'xyz']);
            });

        });
    }
);
