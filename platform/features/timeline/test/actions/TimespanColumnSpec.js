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
    ['../../src/actions/TimespanColumn', '../../src/TimelineFormatter'],
    function (TimespanColumn, TimelineFormatter) {
        describe("TimespanColumn", function () {
            var testTimes,
                mockTimespan,
                mockDomainObject,
                column;

            beforeEach(function () {
                testTimes = {
                    start: 101000,
                    end: 987654321
                };
                mockTimespan = jasmine.createSpyObj(
                    'timespan',
                    [ 'getStart', 'getEnd' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'useCapability', 'hasCapability' ]
                );
                mockTimespan.getStart.andReturn(testTimes.start);
                mockTimespan.getEnd.andReturn(testTimes.end);
                mockDomainObject.useCapability.andCallFake(function (c) {
                    return c === 'timespan' && Promise.resolve(mockTimespan);
                });
                mockDomainObject.hasCapability.andCallFake(function (c) {
                    return c === 'timespan';
                });
            });

            [ "start", "end" ].forEach(function (bound) {
                describe("when referring to " + bound + " times", function () {
                    var name = bound.charAt(0).toUpperCase() + bound.slice(1);

                    beforeEach(function () {
                        column = new TimespanColumn(bound === "start");
                    });

                    it("is named \"" + name + "\"", function () {
                        expect(column.name()).toEqual(name);
                    });

                    describe("value", function () {
                        var testFormatter,
                            value;

                        beforeEach(function () {
                            value = undefined;
                            testFormatter = new TimelineFormatter();
                            column.value(mockDomainObject).then(function (v) {
                                value = v;
                            });
                            waitsFor(function () {
                                return value !== undefined;
                            });
                        });

                        it("returns a formatted " + bound + " time", function () {
                            var expected =
                                testFormatter.format(testTimes[bound]);
                            expect(value).toEqual(expected);
                        });
                    });
                });
            });

        });
    }
);