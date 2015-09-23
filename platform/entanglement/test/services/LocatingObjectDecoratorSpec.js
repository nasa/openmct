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

/*global define,describe,beforeEach,it,jasmine,expect */

define(
    [
        '../../src/services/LocatingObjectDecorator'
    ],
    function (LocatingObjectDecorator) {
        "use strict";

        describe("LocatingObjectDecorator", function () {
            var mockContextualize,
                mockQ,
                mockLog,
                mockObjectService,
                mockCallback,
                testObjects,
                testModels,
                decorator;

            function testPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return testPromise(callback(v));
                    }
                };
            }

            beforeEach(function () {
                // A <- B <- C
                // D <-> E, to verify cycle detection
                testModels = {
                    a: { name: "A" },
                    b: { name: "B", location: "a" },
                    c: { name: "C", location: "b" },
                    d: { name: "D", location: "e" },
                    e: { name: "E", location: "d" }
                };
                testObjects = {};

                mockContextualize = jasmine.createSpy("contextualize");
                mockQ = jasmine.createSpyObj("$q", ["when", "all"]);
                mockLog =
                    jasmine.createSpyObj("$log", ["error", "warn", "info", "debug"]);
                mockObjectService =
                    jasmine.createSpyObj("objectService", ["getObjects"]);

                mockContextualize.andCallFake(function (domainObject, parentObject) {
                    // Not really what contextualize does, but easy to test!
                    return {
                        testObject: domainObject,
                        testParent: parentObject
                    };
                });

                mockQ.when.andCallFake(testPromise);
                mockQ.all.andCallFake(function (promises) {
                    var result = {};
                    Object.keys(promises).forEach(function (k) {
                        promises[k].then(function (v) { result[k] = v; });
                    });
                    return testPromise(result);
                });

                mockObjectService.getObjects.andReturn(testPromise(testObjects));

                mockCallback = jasmine.createSpy("callback");

                Object.keys(testModels).forEach(function (id) {
                    testObjects[id] = jasmine.createSpyObj(
                        "domainObject-" + id,
                        [ "getId", "getModel", "getCapability" ]
                    );
                    testObjects[id].getId.andReturn(id);
                    testObjects[id].getModel.andReturn(testModels[id]);
                });

                decorator = new LocatingObjectDecorator(
                    mockContextualize,
                    mockQ,
                    mockLog,
                    mockObjectService
                );
            });

            it("contextualizes domain objects by location", function () {
                decorator.getObjects(['b', 'c']).then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith({
                    b: {
                        testObject: testObjects.b,
                        testParent: testObjects.a
                    },
                    c: {
                        testObject: testObjects.c,
                        testParent: {
                            testObject: testObjects.b,
                            testParent: testObjects.a
                        }
                    }
                });
            });

            it("warns on cycle detection", function () {
                // Base case, no cycle, no warning
                decorator.getObjects(['a', 'b', 'c']);
                expect(mockLog.warn).not.toHaveBeenCalled();

                decorator.getObjects(['e']);
                expect(mockLog.warn).toHaveBeenCalled();
            });

        });
    }
);
