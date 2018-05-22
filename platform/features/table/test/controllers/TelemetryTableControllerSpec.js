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
        '../../src/controllers/TelemetryTableController',
        '../../../../../src/api/objects/object-utils',
        'lodash'
    ],
    function (TelemetryTableController, objectUtils, _) {

        describe('The TelemetryTableController', function () {

            var controller,
                mockScope,
                mockTimeout,
                mockConductor,
                mockAPI,
                mockDomainObject,
                mockTelemetryAPI,
                mockObjectAPI,
                mockCompositionAPI,
                unobserve,
                mockBounds;

            function getCallback(target, event) {
                return target.calls.filter(function (call) {
                    return call.args[0] === event;
                })[0].args[1];
            }

            beforeEach(function () {
                mockBounds = {
                    start: 0,
                    end: 10
                };
                mockConductor = jasmine.createSpyObj("conductor", [
                    "bounds",
                    "clock",
                    "on",
                    "off",
                    "timeSystem"
                ]);
                mockConductor.bounds.andReturn(mockBounds);
                mockConductor.clock.andReturn(undefined);

                mockDomainObject = jasmine.createSpyObj("domainObject", [
                    "getModel",
                    "getId",
                    "useCapability",
                    "hasCapability"
                ]);
                mockDomainObject.getModel.andReturn({});
                mockDomainObject.getId.andReturn("mockId");
                mockDomainObject.useCapability.andReturn(true);

                mockCompositionAPI = jasmine.createSpyObj("compositionAPI", [
                    "get"
                ]);

                mockObjectAPI = jasmine.createSpyObj("objectAPI", [
                    "observe"
                ]);
                unobserve = jasmine.createSpy("unobserve");
                mockObjectAPI.observe.andReturn(unobserve);

                mockScope = jasmine.createSpyObj("scope", [
                    "$on",
                    "$watch",
                    "$broadcast"
                ]);
                mockScope.domainObject = mockDomainObject;

                mockTelemetryAPI = jasmine.createSpyObj("telemetryAPI", [
                    "isTelemetryObject",
                    "subscribe",
                    "getMetadata",
                    "commonValuesForHints",
                    "request",
                    "limitEvaluator",
                    "getValueFormatter"
                ]);
                mockTelemetryAPI.commonValuesForHints.andReturn([]);
                mockTelemetryAPI.request.andReturn(Promise.resolve([]));
                mockTelemetryAPI.getValueFormatter.andCallFake(function (metadata) {
                    var formatter = jasmine.createSpyObj(
                        'telemetryFormatter:' + metadata.key,
                        [
                            'format',
                            'parse'
                        ]
                    );
                    var getter = function (datum) {
                        return datum[metadata.key];
                    };
                    formatter.format.andCallFake(getter);
                    formatter.parse.andCallFake(getter);
                    return formatter;
                });

                mockTelemetryAPI.isTelemetryObject.andReturn(false);

                mockTimeout = jasmine.createSpy("timeout");
                mockTimeout.andReturn(1); // Return something
                mockTimeout.cancel = jasmine.createSpy("cancel");

                mockAPI = {
                    time: mockConductor,
                    objects: mockObjectAPI,
                    telemetry: mockTelemetryAPI,
                    composition: mockCompositionAPI
                };
                controller = new TelemetryTableController(mockScope, mockTimeout, mockAPI);
            });

            describe('listens for', function () {
                beforeEach(function () {
                    controller.registerChangeListeners();
                });
                it('object mutation', function () {
                    var calledObject = mockObjectAPI.observe.mostRecentCall.args[0];

                    expect(mockObjectAPI.observe).toHaveBeenCalled();
                    expect(calledObject.identifier.key).toEqual(mockDomainObject.getId());
                });
                it('conductor changes', function () {
                    expect(mockConductor.on).toHaveBeenCalledWith("timeSystem", jasmine.any(Function));
                    expect(mockConductor.on).toHaveBeenCalledWith("bounds", jasmine.any(Function));
                    expect(mockConductor.on).toHaveBeenCalledWith("clock", jasmine.any(Function));
                });
            });

            describe('deregisters all listeners on scope destruction', function () {
                var timeSystemListener,
                    boundsListener,
                    clockListener;

                beforeEach(function () {
                    controller.registerChangeListeners();

                    timeSystemListener = getCallback(mockConductor.on, "timeSystem");
                    boundsListener = getCallback(mockConductor.on, "bounds");
                    clockListener = getCallback(mockConductor.on, "clock");

                    var destroy = getCallback(mockScope.$on, "$destroy");
                    destroy();
                });

                it('object mutation', function () {
                    expect(unobserve).toHaveBeenCalled();
                });
                it('conductor changes', function () {
                    expect(mockConductor.off).toHaveBeenCalledWith("timeSystem", timeSystemListener);
                    expect(mockConductor.off).toHaveBeenCalledWith("bounds", boundsListener);
                    expect(mockConductor.off).toHaveBeenCalledWith("clock", clockListener);
                });
            });

            describe ('when getting telemetry', function () {
                var mockComposition,
                    mockTelemetryObject,
                    mockChildren,
                    unsubscribe,
                    done;

                beforeEach(function () {
                    mockComposition = jasmine.createSpyObj("composition", [
                        "load"
                    ]);

                    mockTelemetryObject = {};
                    mockTelemetryObject.identifier = {
                        key: "mockTelemetryObject"
                    };

                    unsubscribe = jasmine.createSpy("unsubscribe");
                    mockTelemetryAPI.subscribe.andReturn(unsubscribe);

                    mockChildren = [mockTelemetryObject];
                    mockComposition.load.andReturn(Promise.resolve(mockChildren));
                    mockCompositionAPI.get.andReturn(mockComposition);

                    mockTelemetryAPI.isTelemetryObject.andCallFake(function (obj) {
                        return obj.identifier.key === mockTelemetryObject.identifier.key;
                    });

                    done = false;
                });

                it('fetches historical data for the time period specified by the conductor bounds', function () {
                    controller.getData().then(function () {
                        done = true;
                    });
                    waitsFor(function () {
                        return done;
                    }, "getData to return", 100);

                    runs(function () {
                        expect(mockTelemetryAPI.request).toHaveBeenCalledWith(mockTelemetryObject, mockBounds);
                    });
                });

                it('unsubscribes on view destruction', function () {
                    controller.getData().then(function () {
                        done = true;
                    });

                    waitsFor(function () {
                        return done;
                    }, "getData to return", 100);

                    runs(function () {
                        var destroy = getCallback(mockScope.$on, "$destroy");
                        destroy();

                        expect(unsubscribe).toHaveBeenCalled();
                    });
                });
                it('fetches historical data for the time period specified by the conductor bounds', function () {
                    controller.getData().then(function () {
                        done = true;
                    });
                    waitsFor(function () {
                        return done;
                    }, "getData to return", 100);

                    runs(function () {
                        expect(mockTelemetryAPI.request).toHaveBeenCalledWith(mockTelemetryObject, mockBounds);
                    });
                });

                it('fetches data for, and subscribes to parent object if it is a telemetry object', function () {
                    controller.getData().then(function () {
                        done = true;
                    });
                    waitsFor(function () {
                        return done;
                    }, "getData to return", 100);

                    runs(function () {
                        expect(mockTelemetryAPI.subscribe).toHaveBeenCalledWith(mockTelemetryObject, jasmine.any(Function), {});
                        expect(mockTelemetryAPI.request).toHaveBeenCalledWith(mockTelemetryObject, jasmine.any(Object));
                    });
                });
                it('fetches data for, and subscribes to parent object if it is a telemetry object', function () {
                    controller.getData().then(function () {
                        done = true;
                    });
                    waitsFor(function () {
                        return done;
                    }, "getData to return", 100);

                    runs(function () {
                        expect(mockTelemetryAPI.subscribe).toHaveBeenCalledWith(mockTelemetryObject, jasmine.any(Function), {});
                        expect(mockTelemetryAPI.request).toHaveBeenCalledWith(mockTelemetryObject, jasmine.any(Object));
                    });
                });

                it('fetches data for, and subscribes to any composees that are telemetry objects if parent is not', function () {
                    mockChildren = [
                        {name: "child 1"}
                    ];
                    var mockTelemetryChildren = [
                        {name: "child 2"},
                        {name: "child 3"},
                        {name: "child 4"}
                    ];
                    mockChildren = mockChildren.concat(mockTelemetryChildren);
                    mockComposition.load.andReturn(Promise.resolve(mockChildren));

                    mockTelemetryAPI.isTelemetryObject.andCallFake(function (object) {
                        if (object === mockTelemetryObject) {
                            return false;
                        } else {
                            return mockTelemetryChildren.indexOf(object) !== -1;
                        }
                    });

                    controller.getData().then(function () {
                        done = true;
                    });

                    waitsFor(function () {
                        return done;
                    }, "getData to return", 100);

                    runs(function () {
                        mockTelemetryChildren.forEach(function (child) {
                            expect(mockTelemetryAPI.subscribe).toHaveBeenCalledWith(child, jasmine.any(Function), {});
                        });

                        mockTelemetryChildren.forEach(function (child) {
                            expect(mockTelemetryAPI.request).toHaveBeenCalledWith(child, jasmine.any(Object));
                        });

                        expect(mockTelemetryAPI.subscribe).not.toHaveBeenCalledWith(mockChildren[0], jasmine.any(Function), {});
                        expect(mockTelemetryAPI.subscribe).not.toHaveBeenCalledWith(mockTelemetryObject[0], jasmine.any(Function), {});
                    });
                });
            });

            it('When in real-time mode, enables auto-scroll', function () {
                controller.registerChangeListeners();

                var clockCallback = getCallback(mockConductor.on, "clock");
                //Confirm pre-condition
                expect(mockScope.autoScroll).toBeFalsy();

                //Mock setting the a clock in the Time API
                clockCallback({});
                expect(mockScope.autoScroll).toBe(true);
            });

            describe('populates table columns', function () {
                var domainMetadata;
                var allMetadata;
                var mockTimeSystem;

                beforeEach(function () {
                    domainMetadata = [{
                        key: "column1",
                        name: "Column 1",
                        hints: {}
                    }];

                    allMetadata = [{
                        key: "column1",
                        name: "Column 1",
                        hints: {}
                    }, {
                        key: "column2",
                        name: "Column 2",
                        hints: {}
                    }, {
                        key: "column3",
                        name: "Column 3",
                        hints: {}
                    }];

                    mockTimeSystem = {
                        key: "column1"
                    };

                    mockTelemetryAPI.commonValuesForHints.andCallFake(function (metadata, hints) {
                        if (_.eq(hints, ["domain"])) {
                            return domainMetadata;
                        } else if (_.eq(hints, [])) {
                            return allMetadata;
                        }
                    });

                    controller.loadColumns([mockDomainObject]);
                });

                it('based on metadata for given objects', function () {
                    expect(mockScope.headers).toBeDefined();
                    expect(mockScope.headers.length).toBeGreaterThan(0);
                    expect(mockScope.headers.indexOf(allMetadata[0].name)).not.toBe(-1);
                    expect(mockScope.headers.indexOf(allMetadata[1].name)).not.toBe(-1);
                    expect(mockScope.headers.indexOf(allMetadata[2].name)).not.toBe(-1);
                });

                it('and sorts by column matching time system', function () {
                    expect(mockScope.defaultSort).not.toEqual("Column 1");
                    controller.sortByTimeSystem(mockTimeSystem);
                    expect(mockScope.defaultSort).toEqual("Column 1");
                });

                it('batches processing of rows for performance when receiving historical telemetry', function () {
                    var mockHistoricalData = [
                        {
                            "column1": 1,
                            "column2": 2,
                            "column3": 3
                        },{
                            "column1": 4,
                            "column2": 5,
                            "column3": 6
                        }, {
                            "column1": 7,
                            "column2": 8,
                            "column3": 9
                        }
                    ];
                    controller.batchSize = 2;
                    mockTelemetryAPI.request.andReturn(Promise.resolve(mockHistoricalData));
                    controller.getHistoricalData([mockDomainObject]);

                    waitsFor(function () {
                        return !!controller.timeoutHandle;
                    }, "first batch to be processed", 100);

                    runs(function () {
                        //Verify that timeout is being used to yield process
                        expect(mockTimeout).toHaveBeenCalled();
                        mockTimeout.mostRecentCall.args[0]();
                        expect(mockTimeout.calls.length).toBe(2);
                        mockTimeout.mostRecentCall.args[0]();
                        expect(mockScope.rows.length).toBe(3);
                    });
                });
            });

            it('Removes telemetry rows from table when they fall out of bounds', function () {
                var discardedRows = [
                    {"column1": "value 1"},
                    {"column2": "value 2"},
                    {"column3": "value 3"}
                ];

                spyOn(controller.telemetry, "on").andCallThrough();

                controller.registerChangeListeners();
                expect(controller.telemetry.on).toHaveBeenCalledWith("discarded", jasmine.any(Function));
                var onDiscard = getCallback(controller.telemetry.on, "discarded");
                onDiscard(discardedRows);
                expect(mockScope.$broadcast).toHaveBeenCalledWith("remove:rows", discardedRows);
            });

            describe('when telemetry is added', function () {
                var testRows;
                var expectedRows;

                beforeEach(function () {
                    testRows = [{ a: 0 }, { a: 1 }, { a: 2 }];
                    mockScope.rows = [{ a: -1 }];
                    expectedRows = mockScope.rows.concat(testRows);

                    spyOn(controller.telemetry, "on").andCallThrough();
                    controller.registerChangeListeners();

                    controller.telemetry.on.calls.forEach(function (call) {
                        if (call.args[0] === 'added') {
                            call.args[1](testRows);
                        }
                    });
                });

                it("adds it to rows in scope", function () {
                    expect(mockScope.rows).toEqual(expectedRows);
                });
            });
        });
    });
