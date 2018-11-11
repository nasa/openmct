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
                return target.calls.all().filter(function (call) {
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
                mockConductor.bounds.and.returnValue(mockBounds);
                mockConductor.clock.and.returnValue(undefined);

                mockDomainObject = jasmine.createSpyObj("domainObject", [
                    "getModel",
                    "getId",
                    "useCapability",
                    "hasCapability"
                ]);
                mockDomainObject.getModel.and.returnValue({});
                mockDomainObject.getId.and.returnValue("mockId");
                mockDomainObject.useCapability.and.returnValue(true);

                mockCompositionAPI = jasmine.createSpyObj("compositionAPI", [
                    "get"
                ]);

                mockObjectAPI = jasmine.createSpyObj("objectAPI", [
                    "observe",
                    "makeKeyString"
                ]);
                unobserve = jasmine.createSpy("unobserve");
                mockObjectAPI.observe.and.returnValue(unobserve);

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
                mockTelemetryAPI.commonValuesForHints.and.returnValue([]);
                mockTelemetryAPI.request.and.returnValue(Promise.resolve([]));
                mockTelemetryAPI.getMetadata.and.returnValue({
                    values: function () {
                        return [];
                    }
                });
                mockTelemetryAPI.getValueFormatter.and.callFake(function (metadata) {
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
                    formatter.format.and.callFake(getter);
                    formatter.parse.and.callFake(getter);
                    return formatter;
                });

                mockTelemetryAPI.isTelemetryObject.and.returnValue(false);

                mockTimeout = jasmine.createSpy("timeout");
                mockTimeout.and.returnValue(1); // Return something
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
                    var calledObject = mockObjectAPI.observe.calls.mostRecent().args[0];

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
                    unsubscribe;

                beforeEach(function () {
                    mockComposition = jasmine.createSpyObj("composition", [
                        "load"
                    ]);

                    mockTelemetryObject = {};
                    mockTelemetryObject.identifier = {
                        key: "mockTelemetryObject"
                    };

                    unsubscribe = jasmine.createSpy("unsubscribe");
                    mockTelemetryAPI.subscribe.and.returnValue(unsubscribe);

                    mockChildren = [mockTelemetryObject];
                    mockComposition.load.and.returnValue(Promise.resolve(mockChildren));
                    mockCompositionAPI.get.and.returnValue(mockComposition);

                    mockTelemetryAPI.isTelemetryObject.and.callFake(function (obj) {
                        return obj.identifier.key === mockTelemetryObject.identifier.key;
                    });
                });

                it('fetches historical data for the time period specified by the conductor bounds', function () {
                    return controller.getData().then(function () {
                        expect(mockTelemetryAPI.request).toHaveBeenCalledWith(mockTelemetryObject, mockBounds);
                    });
                });

                it('unsubscribes on view destruction', function () {
                    return controller.getData().then(function () {
                        var destroy = getCallback(mockScope.$on, "$destroy");
                        destroy();

                        expect(unsubscribe).toHaveBeenCalled();
                    });
                });
                it('fetches historical data for the time period specified by the conductor bounds', function () {
                    return controller.getData().then(function () {
                        expect(mockTelemetryAPI.request).toHaveBeenCalledWith(mockTelemetryObject, mockBounds);
                    });
                });

                it('fetches data for, and subscribes to parent object if it is a telemetry object', function () {
                    return controller.getData().then(function () {
                        expect(mockTelemetryAPI.subscribe).toHaveBeenCalledWith(mockTelemetryObject, jasmine.any(Function), {});
                        expect(mockTelemetryAPI.request).toHaveBeenCalledWith(mockTelemetryObject, jasmine.any(Object));
                    });
                });
                it('fetches data for, and subscribes to parent object if it is a telemetry object', function () {
                    return controller.getData().then(function () {
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
                    mockComposition.load.and.returnValue(Promise.resolve(mockChildren));

                    mockTelemetryAPI.isTelemetryObject.and.callFake(function (object) {
                        if (object === mockTelemetryObject) {
                            return false;
                        } else {
                            return mockTelemetryChildren.indexOf(object) !== -1;
                        }
                    });

                    return controller.getData().then(function () {
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
                var allMetadata;
                var mockTimeSystem1;
                var mockTimeSystem2;

                beforeEach(function () {
                    allMetadata = [{
                        key: "column1",
                        name: "Column 1",
                        hints: {
                            domain: 1
                        }
                    }, {
                        key: "column2",
                        name: "Column 2",
                        hints: {
                            domain: 2
                        }
                    }, {
                        key: "column3",
                        name: "Column 3",
                        hints: {}
                    }];

                    mockTimeSystem1 = {
                        key: "column1"
                    };
                    mockTimeSystem2 = {
                        key: "column2"
                    };

                    mockConductor.timeSystem.and.returnValue(mockTimeSystem1);

                    mockTelemetryAPI.getMetadata.and.returnValue({
                        values: function () {
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
                    expect(mockScope.defaultSort).toEqual("Column 1");

                    mockConductor.timeSystem.and.returnValue(mockTimeSystem2);
                    controller.sortByTimeSystem();

                    expect(mockScope.defaultSort).toEqual("Column 2");
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
                    mockTelemetryAPI.request.and.returnValue(Promise.resolve(mockHistoricalData));
                    controller.getHistoricalData([mockDomainObject]);

                    return new Promise(function (resolve) {
                        mockTimeout.and.callFake(function () {
                            resolve();
                        });
                    }).then(function () {
                        mockTimeout.calls.mostRecent().args[0]();
                        expect(mockTimeout.calls.count()).toBe(2);
                        mockTimeout.calls.mostRecent().args[0]();
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

                spyOn(controller.telemetry, "on").and.callThrough();

                controller.registerChangeListeners();
                expect(controller.telemetry.on).toHaveBeenCalledWith("discarded", jasmine.any(Function));
                var onDiscard = getCallback(controller.telemetry.on, "discarded");
                onDiscard(discardedRows);
                expect(mockScope.$broadcast).toHaveBeenCalledWith("remove:rows", discardedRows);
            });

            describe('when telemetry is added', function () {
                var testRows;

                beforeEach(function () {
                    testRows = [{ a: 0 }, { a: 1 }, { a: 2 }];

                    controller.registerChangeListeners();
                    controller.telemetry.add(testRows);
                });

                it("Adds the rows to the MCTTable directive", function () {
                    expect(mockScope.$broadcast).toHaveBeenCalledWith("add:rows", testRows);
                });
            });
        });
    });
