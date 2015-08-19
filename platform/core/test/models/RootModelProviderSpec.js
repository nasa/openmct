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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * RootModelProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/models/RootModelProvider"],
    function (RootModelProvider) {
        "use strict";

        describe("The root model provider", function () {
            var roots = [
                    {
                        "id": "a",
                        "model": {
                            "name": "Thing A",
                            "someProperty": "Some Value A"
                        }
                    },
                    {
                        "id": "b",
                        "model": {
                            "name": "Thing B",
                            "someProperty": "Some Value B"
                        }
                    }
                ],
                captured,
                mockLog,
                mockQ,
                provider;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            function capture(value) { captured = value; }


            beforeEach(function () {
                mockQ = { when: mockPromise };
                mockLog = jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                provider = new RootModelProvider(roots, mockQ, mockLog);
            });

            it("provides models from extension declarations", function () {
                // Verify that we got the promise as the return value
                provider.getModels(["a", "b"]).then(capture);

                // Verify that the promise has the desired models
                expect(captured.a.name).toEqual("Thing A");
                expect(captured.a.someProperty).toEqual("Some Value A");
                expect(captured.b.name).toEqual("Thing B");
                expect(captured.b.someProperty).toEqual("Some Value B");
            });

            it("provides models with a location", function () {
                provider.getModels(["a", "b"]).then(capture);
                expect(captured.a.location).toBe('ROOT');
                expect(captured.b.location).toBe('ROOT');
            });


            it("does not provide models which are not in extension declarations", function () {
                provider.getModels(["c"]).then(capture);

                // Verify that the promise has the desired models
                expect(captured.c).toBeUndefined();
            });

            it("provides a ROOT object with roots in its composition", function () {
                provider.getModels(["ROOT"]).then(capture);

                expect(captured.ROOT).toBeDefined();
                expect(captured.ROOT.composition).toEqual(["a", "b"]);
            });

        });
    }
);
