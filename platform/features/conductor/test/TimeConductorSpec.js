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

define(
    ["../src/TimeConductor"],
    function (TimeConductor) {
        "use strict";

        describe("TimeConductor", function () {
            var testStart,
                testEnd,
                testDomains,
                conductor;

            beforeEach(function () {
                testStart = 42;
                testEnd = 12321;
                testDomains = [
                    { key: "d1", name: "Domain #1" },
                    { key: "d2", name: "Domain #2" }
                ];
                conductor = new TimeConductor(testStart, testEnd, testDomains);
            });

            it("provides accessors for query/display start/end times", function () {
                expect(conductor.displayStart()).toEqual(testStart);
                expect(conductor.displayEnd()).toEqual(testEnd);
            });

            it("provides setters for query/display start/end times", function () {
                expect(conductor.displayStart(3)).toEqual(3);
                expect(conductor.displayEnd(4)).toEqual(4);
                expect(conductor.displayStart()).toEqual(3);
                expect(conductor.displayEnd()).toEqual(4);
            });

            it("exposes domain options", function () {
                expect(conductor.domainOptions()).toEqual(testDomains);
            });

            it("exposes the current domain choice", function () {
                expect(conductor.domain()).toEqual(testDomains[0]);
            });

            it("allows the domain choice to be changed", function () {
                conductor.domain(testDomains[1].key);
                expect(conductor.domain()).toEqual(testDomains[1]);
            });

            it("throws an error on attempts to set an invalid domain", function () {
                expect(function () {
                    conductor.domain("invalid-domain");
                }).toThrow();
            });

        });
    }
);
