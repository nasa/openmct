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
    ["../src/TimeConductor"],
    function (TimeConductor) {
        "use strict";

        describe("TimeConductor", function () {
            var testStart,
                testEnd,
                conductor;

            beforeEach(function () {
                testStart = 42;
                testEnd = 12321;
                conductor = new TimeConductor(testStart, testEnd);
            });

            it("provides accessors for query/display start/end times", function () {
                expect(conductor.queryStart()).toEqual(testStart);
                expect(conductor.queryEnd()).toEqual(testEnd);
                expect(conductor.displayStart()).toEqual(testStart);
                expect(conductor.displayEnd()).toEqual(testEnd);
            });

            it("provides setters for query/display start/end times", function () {
                expect(conductor.queryStart(1)).toEqual(1);
                expect(conductor.queryEnd(2)).toEqual(2);
                expect(conductor.displayStart(3)).toEqual(3);
                expect(conductor.displayEnd(4)).toEqual(4);
                expect(conductor.queryStart()).toEqual(1);
                expect(conductor.queryEnd()).toEqual(2);
                expect(conductor.displayStart()).toEqual(3);
                expect(conductor.displayEnd()).toEqual(4);
            });

        });
    }
);
