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
    ['../../src/controllers/ActivityModeValuesController'],
    function (ActivityModeValuesController) {
        'use strict';

        describe("An Activity Mode's Values view controller", function () {
            var testResources,
                controller;

            beforeEach(function () {
                testResources = [
                    { key: 'abc', name: "Some name" },
                    { key: 'def', name: "Test type", units: "Test units" },
                    { key: 'xyz', name: "Something else" }
                ];
                controller = new ActivityModeValuesController(testResources);
            });

            it("exposes resource metadata by key", function () {
                expect(controller.metadata('abc')).toEqual(testResources[0]);
                expect(controller.metadata('def')).toEqual(testResources[1]);
                expect(controller.metadata('xyz')).toEqual(testResources[2]);
            });

            it("exposes no metadata for unknown keys", function () {
                expect(controller.metadata('???')).toBeUndefined();
            });
        });
    }
);