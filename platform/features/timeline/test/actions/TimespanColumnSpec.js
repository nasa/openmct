/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    ['../../src/actions/TimespanColumn', '../../src/TimelineFormatter'],
    (TimespanColumn, TimelineFormatter) => {
        describe("TimespanColumn", () => {
            let testTimes,
                mockTimespan,
                mockDomainObject,
                column;

            beforeEach(() => {
                testTimes = {
                    start: 101000,
                    end: 987654321
                };
                mockTimespan = jasmine.createSpyObj(
                    'timespan',
                    ['getStart', 'getEnd']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['useCapability', 'hasCapability']
                );
                mockTimespan.getStart.andReturn(testTimes.start);
                mockTimespan.getEnd.andReturn(testTimes.end);
                mockDomainObject.useCapability.andCallFake( (c) => {
                    return c === 'timespan' && Promise.resolve(mockTimespan);
                });
                mockDomainObject.hasCapability.andCallFake( (c) => {
                    return c === 'timespan';
                });
            });

            ["start", "end"].forEach( (bound) => {
                describe("when referring to " + bound + " times", () => {
                    let name = bound.charAt(0).toUpperCase() + bound.slice(1);

                    beforeEach(() => {
                        column = new TimespanColumn(bound === "start");
                    });

                    it("is named \"" + name + "\"", () => {
                        expect(column.name()).toEqual(name);
                    });

                    describe("value", () => {
                        let testFormatter,
                            value;

                        beforeEach(() => {
                            value = undefined;
                            testFormatter = new TimelineFormatter();
                            column.value(mockDomainObject).then( (v) => {
                                value = v;
                            });
                            waitsFor(() => {
                                return value !== undefined;
                            });
                        });

                        it("returns a formatted " + bound + " time", () => {
                            let expected =
                                testFormatter.format(testTimes[bound]);
                            expect(value).toEqual(expected);
                        });
                    });
                });
            });

        });
    }
);
