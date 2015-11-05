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
    ['../../src/capabilities/TimelineTimespanCapability'],
    function (TimelineTimespanCapability) {
        'use strict';

        describe("A Timeline's timespan capability", function () {
            var mockQ,
                mockDomainObject,
                mockChildA,
                mockChildB,
                mockTimespanA,
                mockTimespanB,
                capability;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return asPromise(callback(v));
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getModel', 'getCapability', 'useCapability' ]
                );
                mockChildA = jasmine.createSpyObj(
                    'childA',
                    [ 'getModel', 'useCapability', 'hasCapability' ]
                );
                mockChildB = jasmine.createSpyObj(
                    'childA',
                    [ 'getModel', 'useCapability', 'hasCapability' ]
                );
                mockTimespanA = jasmine.createSpyObj(
                    'timespanA',
                    [ 'getEnd' ]
                );
                mockTimespanB = jasmine.createSpyObj(
                    'timespanB',
                    [ 'getEnd' ]
                );

                mockQ.when.andCallFake(asPromise);
                mockQ.all.andCallFake(function (values) {
                    var result = [];
                    function addResult(v) { result.push(v); }
                    function promiseResult(v) { asPromise(v).then(addResult); }
                    values.forEach(promiseResult);
                    return asPromise(result);
                });
                mockDomainObject.getModel.andReturn({
                    start: {
                        timestamp: 42000,
                        epoch: "TEST"
                    },
                    duration: {
                        timestamp: 12321
                    }
                });
                mockDomainObject.useCapability.andCallFake(function (c) {
                    if (c === 'composition') {
                        return asPromise([ mockChildA, mockChildB ]);
                    }
                });
                mockChildA.hasCapability.andReturn(true);
                mockChildB.hasCapability.andReturn(true);
                mockChildA.useCapability.andCallFake(function (c) {
                    return c === 'timespan' && mockTimespanA;
                });
                mockChildB.useCapability.andCallFake(function (c) {
                    return c === 'timespan' && mockTimespanB;
                });

                capability = new TimelineTimespanCapability(
                    mockQ,
                    mockDomainObject
                );
            });

            it("applies only to timeline objects", function () {
                expect(TimelineTimespanCapability.appliesTo({
                    type: 'timeline'
                })).toBeTruthy();
                expect(TimelineTimespanCapability.appliesTo({
                    type: 'folder'
                })).toBeFalsy();
            });

            it("provides timespan based on model", function () {
                var mockCallback = jasmine.createSpy('callback');
                capability.invoke().then(mockCallback);
                // We verify other methods in ActivityTimespanSpec,
                // so just make sure we got something that looks right.
                expect(mockCallback).toHaveBeenCalledWith({
                    getStart: jasmine.any(Function),
                    getEnd: jasmine.any(Function),
                    getDuration: jasmine.any(Function),
                    setStart: jasmine.any(Function),
                    setEnd: jasmine.any(Function),
                    setDuration: jasmine.any(Function),
                    getEpoch: jasmine.any(Function)
                });
                // Finally, verify that getEnd recurses
                mockCallback.mostRecentCall.args[0].getEnd();
                expect(mockTimespanA.getEnd).toHaveBeenCalled();
                expect(mockTimespanB.getEnd).toHaveBeenCalled();
            });
        });
    }
);
