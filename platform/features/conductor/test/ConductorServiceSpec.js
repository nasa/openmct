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
    ["../src/ConductorService"],
    function (ConductorService) {
        "use strict";

        var TEST_NOW = 1020304050;

        describe("ConductorService", function () {
            var mockNow,
                conductorService;

            beforeEach(function () {
                mockNow = jasmine.createSpy('now');
                mockNow.andReturn(TEST_NOW);
                conductorService = new ConductorService(mockNow);
            });

            it("initializes a time conductor around the current time", function () {
                var conductor = conductorService.getConductor();
                expect(conductor.displayStart() <= TEST_NOW).toBeTruthy();
                expect(conductor.displayEnd() >= TEST_NOW).toBeTruthy();
                expect(conductor.displayEnd() > conductor.displayStart())
                    .toBeTruthy();
            });

            it("provides a single shared time conductor instance", function () {
                expect(conductorService.getConductor())
                    .toBe(conductorService.getConductor());
            });
        });
    }
);
