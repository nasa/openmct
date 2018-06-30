/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    [
        "../src/TelemetryCollection"
    ],
    function (TelemetryCollection) {

        describe("A telemetry collection", function () {

            var collection;
            var telemetryObjects;
            var ms;
            var integerTextMap = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE",
                "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN"];

            beforeEach(function () {
                telemetryObjects = [0,9,2,4,7,8,5,1,3,6].map(function (number) {
                    ms = number * 1000;
                    return {
                        timestamp: ms,
                        value: {
                            integer: number,
                            text: integerTextMap[number]
                        }
                    };
                });
                collection = new TelemetryCollection();
            });

            it("Sorts inserted telemetry by specified field",
                function () {
                    collection.sort('value.integer');
                    collection.add(telemetryObjects);
                    expect(collection.telemetry[0].value.integer).toBe(0);
                    expect(collection.telemetry[1].value.integer).toBe(1);
                    expect(collection.telemetry[2].value.integer).toBe(2);
                    expect(collection.telemetry[3].value.integer).toBe(3);

                    collection.sort('value.text');
                    expect(collection.telemetry[0].value.text).toBe("EIGHT");
                    expect(collection.telemetry[1].value.text).toBe("FIVE");
                    expect(collection.telemetry[2].value.text).toBe("FOUR");
                    expect(collection.telemetry[3].value.text).toBe("NINE");
                }
            );

            describe("on bounds change", function () {
                var discardedCallback;

                beforeEach(function () {
                    discardedCallback = jasmine.createSpy("discarded");
                    collection.on("discarded", discardedCallback);
                    collection.sort("timestamp");
                    collection.add(telemetryObjects);
                    collection.bounds({start: 5000, end: 8000});
                });


                it("emits an event indicating that telemetry has " +
                    "been discarded", function () {
                    expect(discardedCallback).toHaveBeenCalled();
                });

                it("discards telemetry data with a time stamp " +
                    "before specified start bound", function () {
                    var discarded = discardedCallback.calls.mostRecent().args[0];

                    // Expect 5 because as an optimization, the TelemetryCollection
                    // will not consider telemetry values that exceed the upper
                    // bounds. Arbitrary bounds changes in which the end bound is
                    // decreased is assumed to require a new historical query, and
                    // hence re-population of the collection anyway
                    expect(discarded.length).toBe(5);
                    expect(discarded[0].value.integer).toBe(0);
                    expect(discarded[1].value.integer).toBe(1);
                    expect(discarded[4].value.integer).toBe(4);
                });
            });

            describe("when adding telemetry to a collection", function () {
                var addedCallback;
                beforeEach(function () {
                    collection.sort("timestamp");
                    collection.add(telemetryObjects);
                    addedCallback = jasmine.createSpy("added");
                    collection.on("added", addedCallback);
                });

                it("emits an event",
                    function () {
                        var addedObject = {
                                timestamp: 10000,
                                value: {
                                    integer: 10,
                                    text: integerTextMap[10]
                                }
                            };
                        collection.add([addedObject]);
                        expect(addedCallback).toHaveBeenCalledWith([addedObject]);
                    }
                );
                it("inserts in the correct order",
                    function () {
                        var addedObjectA = {
                            timestamp: 10000,
                            value: {
                                integer: 10,
                                text: integerTextMap[10]
                            }
                        };
                        var addedObjectB = {
                            timestamp: 11000,
                            value: {
                                integer: 11,
                                text: integerTextMap[11]
                            }
                        };
                        collection.add([addedObjectB, addedObjectA]);

                        expect(collection.telemetry[11]).toBe(addedObjectB);
                    }
                );
                it("maintains insertion order in the case of duplicate time stamps",
                    function () {
                        var addedObjectA = {
                            timestamp: 10000,
                            value: {
                                integer: 10,
                                text: integerTextMap[10]
                            }
                        };
                        var addedObjectB = {
                            timestamp: 10000,
                            value: {
                                integer: 11,
                                text: integerTextMap[11]
                            }
                        };
                        collection.add([addedObjectA, addedObjectB]);

                        expect(collection.telemetry[11]).toBe(addedObjectB);
                    }
                );
            });

            describe("buffers telemetry", function () {
                var addedObjectA;
                var addedObjectB;

                beforeEach(function () {
                    collection.sort("timestamp");
                    collection.add(telemetryObjects);

                    addedObjectA = {
                        timestamp: 10000,
                        value: {
                            integer: 10,
                            text: integerTextMap[10]
                        }
                    };
                    addedObjectB = {
                        timestamp: 11000,
                        value: {
                            integer: 11,
                            text: integerTextMap[11]
                        }
                    };

                    collection.bounds({start: 0, end: 10000});
                    collection.add([addedObjectA, addedObjectB]);
                });
                it("when it falls outside of bounds", function () {
                    expect(collection.highBuffer).toBeDefined();
                    expect(collection.highBuffer.length).toBe(1);
                    expect(collection.highBuffer[0]).toBe(addedObjectB);
                });
                it("and adds it to collection when it falls within bounds", function () {
                    expect(collection.telemetry.length).toBe(11);
                    collection.bounds({start: 0, end: 11000});
                    expect(collection.telemetry.length).toBe(12);
                    expect(collection.telemetry[11]).toBe(addedObjectB);
                });
                it("and removes it from the buffer when it falls within bounds", function () {
                    expect(collection.highBuffer.length).toBe(1);
                    collection.bounds({start: 0, end: 11000});
                    expect(collection.highBuffer.length).toBe(0);
                });
            });
        });
    }
);
