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

define(['./TimeConductorController'], function (TimeConductorController) {
    xdescribe("The time conductor controller", function () {
        var mockScope;
        var mockWindow;
        var mockTimeConductor;
        var mockConductorViewService;
        var mockTimeSystems;
        var controller;
        var mockFormatService;
        var mockFormat;
        var mockLocation;

        beforeEach(function () {
            mockScope = jasmine.createSpyObj("$scope", [
                "$watch",
                "$on"
            ]);

            mockWindow = jasmine.createSpyObj("$window", ["requestAnimationFrame"]);
            mockTimeConductor = jasmine.createSpyObj(
                "TimeConductor",
                [
                    "bounds",
                    "timeSystem",
                    "on",
                    "off"
                ]
            );
            mockTimeConductor.bounds.and.returnValue({start: undefined, end: undefined});

            mockConductorViewService = jasmine.createSpyObj(
                "ConductorViewService",
                [
                    "availableModes",
                    "mode",
                    "availableTimeSystems",
                    "deltas",
                    "deltas",
                    "on",
                    "off"
                ]
            );
            mockConductorViewService.availableModes.and.returnValue([]);
            mockConductorViewService.availableTimeSystems.and.returnValue([]);

            mockFormatService = jasmine.createSpyObj('formatService', [
                'getFormat'
            ]);
            mockFormat = jasmine.createSpyObj('format', [
                'format'
            ]);
            mockFormatService.getFormat.and.returnValue(mockFormat);
            mockLocation = jasmine.createSpyObj('location', [
                'search'
            ]);
            mockLocation.search.and.returnValue({});

            mockTimeSystems = [];
        });

        function getListener(target, event) {
            return target.calls.all().filter(function (call) {
                return call.args[0] === event;
            })[0].args[1];
        }

        describe("when time conductor state changes", function () {
            var mockDeltaFormat;
            var defaultBounds;
            var defaultDeltas;
            var mockDefaults;
            var timeSystem;
            var tsListener;

            beforeEach(function () {
                mockFormat = {};
                mockDeltaFormat = {};
                defaultBounds = {
                    start: 2,
                    end: 3
                };
                defaultDeltas = {
                    start: 10,
                    end: 20
                };
                mockDefaults = {
                    deltas: defaultDeltas,
                    bounds: defaultBounds
                };
                timeSystem = {
                    metadata: {
                        key: 'mock'
                    },
                    formats: function () {
                        return [mockFormat];
                    },
                    deltaFormat: function () {
                        return mockDeltaFormat;
                    },
                    defaults: function () {
                        return mockDefaults;
                    }
                };

                controller = new TimeConductorController(
                    mockScope,
                    mockWindow,
                    mockLocation,
                    {conductor: mockTimeConductor},
                    mockConductorViewService,
                    mockFormatService,
                    'fixed',
                    true

                );

                tsListener = getListener(mockTimeConductor.on, "timeSystem");
            });

            it("listens for changes to conductor state", function () {
                expect(mockTimeConductor.on).toHaveBeenCalledWith("timeSystem", controller.changeTimeSystem);
                expect(mockTimeConductor.on).toHaveBeenCalledWith("bounds", controller.changeBounds);
            });

            it("deregisters conductor listens when scope is destroyed", function () {
                expect(mockScope.$on).toHaveBeenCalledWith("$destroy", controller.destroy);

                controller.destroy();
                expect(mockTimeConductor.off).toHaveBeenCalledWith("timeSystem", controller.changeTimeSystem);
                expect(mockTimeConductor.off).toHaveBeenCalledWith("bounds", controller.changeBounds);
            });

            it("when time system changes, sets time system on scope", function () {
                expect(tsListener).toBeDefined();
                tsListener(timeSystem);

                expect(mockScope.timeSystemModel).toBeDefined();
                expect(mockScope.timeSystemModel.selected).toBe(timeSystem);
                expect(mockScope.timeSystemModel.format).toBe(mockFormat);
                expect(mockScope.timeSystemModel.deltaFormat).toBe(mockDeltaFormat);
            });

            it("when time system changes, sets defaults on scope", function () {
                mockDefaults.zoom = {
                    min: 100,
                    max: 10
                };
                mockTimeConductor.timeSystem.and.returnValue(timeSystem);
                tsListener(timeSystem);

                expect(mockScope.boundsModel.start).toEqual(defaultBounds.start);
                expect(mockScope.boundsModel.end).toEqual(defaultBounds.end);

                expect(mockScope.boundsModel.startDelta).toEqual(defaultDeltas.start);
                expect(mockScope.boundsModel.endDelta).toEqual(defaultDeltas.end);

                expect(mockScope.timeSystemModel.minZoom).toBe(mockDefaults.zoom.min);
                expect(mockScope.timeSystemModel.maxZoom).toBe(mockDefaults.zoom.max);
            });

            it("supports zoom if time system defines zoom defaults", function () {

                mockDefaults.zoom = undefined;

                tsListener(timeSystem);
                expect(controller.supportsZoom).toBe(false);

                mockDefaults.zoom = {
                    min: 100,
                    max: 10
                };

                var anotherTimeSystem = Object.create(timeSystem);
                timeSystem.defaults = function () {
                    return mockDefaults;
                };

                tsListener(anotherTimeSystem);
                expect(controller.supportsZoom).toBe(true);

            });

            it("when bounds change, sets the correct zoom slider value", function () {
                var bounds = {
                    start: 0,
                    end: 50
                };
                mockDefaults.zoom = {
                    min: 100,
                    max: 0
                };

                function exponentializer(rawValue) {
                    return 1 - Math.pow(rawValue, 1 / 4);
                }

                mockTimeConductor.timeSystem.and.returnValue(timeSystem);
                //Set zoom defaults
                tsListener(timeSystem);

                controller.changeBounds(bounds);
                expect(controller.currentZoom).toEqual(exponentializer(0.5));

            });

            it("when bounds change, sets them on scope", function () {
                var bounds = {
                    start: 1,
                    end: 2
                };

                var boundsListener = getListener(mockTimeConductor.on, "bounds");
                expect(boundsListener).toBeDefined();
                boundsListener(bounds);

                expect(mockScope.boundsModel).toBeDefined();
                expect(mockScope.boundsModel.start).toEqual(bounds.start);
                expect(mockScope.boundsModel.end).toEqual(bounds.end);
            });
        });

        describe("when user makes changes from UI", function () {
            var mode = "realtime";
            var ts1Metadata;
            var ts2Metadata;
            var ts3Metadata;

            beforeEach(function () {
                mode = "realtime";
                ts1Metadata = {
                    'key': 'ts1',
                    'name': 'Time System One',
                    'cssClass': 'cssClassOne'
                };
                ts2Metadata = {
                    'key': 'ts2',
                    'name': 'Time System Two',
                    'cssClass': 'cssClassTwo'
                };
                ts3Metadata = {
                    'key': 'ts3',
                    'name': 'Time System Three',
                    'cssClass': 'cssClassThree'
                };
                mockTimeSystems = [
                    {
                        metadata: ts1Metadata
                    },
                    {
                        metadata: ts2Metadata
                    },
                    {
                        metadata: ts3Metadata
                    }
                ];

                //Wrap in mock constructors
                mockConductorViewService.systems = mockTimeSystems;

                controller = new TimeConductorController(
                    mockScope,
                    mockWindow,
                    mockLocation,
                    {conductor: mockTimeConductor},
                    mockConductorViewService,
                    mockFormatService,
                    "fixed",
                    true
                );
            });

            it("sets the mode on scope", function () {
                mockConductorViewService.availableTimeSystems.and.returnValue(mockTimeSystems);
                controller.setMode(mode);

                expect(mockScope.modeModel.selectedKey).toEqual(mode);
            });

            it("sets available time systems on scope when mode changes", function () {
                mockConductorViewService.availableTimeSystems.and.returnValue(mockTimeSystems);
                controller.setMode(mode);

                expect(mockScope.timeSystemModel.options.length).toEqual(3);
                expect(mockScope.timeSystemModel.options[0]).toEqual(ts1Metadata);
                expect(mockScope.timeSystemModel.options[1]).toEqual(ts2Metadata);
                expect(mockScope.timeSystemModel.options[2]).toEqual(ts3Metadata);
            });

            it("sets bounds on the time conductor", function () {
                var formModel = {
                    start: 1,
                    end: 10
                };

                controller.setBounds(formModel);
                expect(mockTimeConductor.bounds).toHaveBeenCalledWith(formModel);
            });

            it("applies deltas when they change in form", function () {
                var deltas = {
                    start: 1000,
                    end: 2000
                };
                var formModel = {
                    startDelta: deltas.start,
                    endDelta: deltas.end
                };

                controller.setDeltas(formModel);
                expect(mockConductorViewService.deltas).toHaveBeenCalledWith(deltas);
            });

            it("sets the time system on the time conductor", function () {
                var defaultBounds = {
                    start: 5,
                    end: 6
                };
                var timeSystem = {
                    metadata: {
                        key: 'testTimeSystem'
                    },
                    defaults: function () {
                        return {
                            bounds: defaultBounds
                        };
                    }
                };

                controller.timeSystems = [timeSystem];

                controller.selectTimeSystemByKey('testTimeSystem');
                expect(mockTimeConductor.timeSystem).toHaveBeenCalledWith(timeSystem, defaultBounds);
            });

            it("updates form bounds during pan events", function () {
                var testBounds = {
                    start: 10,
                    end: 20
                };

                expect(controller.$scope.boundsModel.start).not.toBe(testBounds.start);
                expect(controller.$scope.boundsModel.end).not.toBe(testBounds.end);

                expect(controller.conductorViewService.on).toHaveBeenCalledWith("pan",
                    controller.onPan);

                getListener(controller.conductorViewService.on, "pan")(testBounds);

                expect(controller.$scope.boundsModel.start).toBe(testBounds.start);
                expect(controller.$scope.boundsModel.end).toBe(testBounds.end);
            });
        });

        describe("when the URL defines conductor state", function () {
            var urlBounds;
            var urlTimeSystem;
            var urlMode;
            var urlDeltas;

            var mockDeltaFormat;
            var defaultBounds;
            var defaultDeltas;
            var mockDefaults;
            var timeSystem;
            var otherTimeSystem;
            var mockSearchObject;

            beforeEach(function () {

                mockFormat = {};
                mockDeltaFormat = {};
                defaultBounds = {
                    start: 2,
                    end: 3
                };
                defaultDeltas = {
                    start: 10,
                    end: 20
                };
                mockDefaults = {
                    deltas: defaultDeltas,
                    bounds: defaultBounds
                };
                timeSystem = {
                    metadata: {
                        key: 'mockTimeSystem'
                    },
                    formats: function () {
                        return [mockFormat];
                    },
                    deltaFormat: function () {
                        return mockDeltaFormat;
                    },
                    defaults: function () {
                        return mockDefaults;
                    }
                };
                otherTimeSystem = {
                    metadata: {
                        key: 'otherTimeSystem'
                    },
                    formats: function () {
                        return [mockFormat];
                    },
                    deltaFormat: function () {
                        return mockDeltaFormat;
                    },
                    defaults: function () {
                        return mockDefaults;
                    }
                };

                mockConductorViewService.systems = [timeSystem, otherTimeSystem];

                urlBounds = {
                    start: 100,
                    end: 200
                };
                urlTimeSystem = "otherTimeSystem";
                urlMode = "realtime";
                urlDeltas = {
                    start: 300,
                    end: 400
                };
                mockSearchObject = {
                    "tc.startBound": urlBounds.start,
                    "tc.endBound": urlBounds.end,
                    "tc.startDelta": urlDeltas.start,
                    "tc.endDelta": urlDeltas.end,
                    "tc.timeSystem": urlTimeSystem
                };
                mockLocation.search.and.returnValue(mockSearchObject);
                mockTimeConductor.timeSystem.and.returnValue(timeSystem);

                controller = new TimeConductorController(
                    mockScope,
                    mockWindow,
                    mockLocation,
                    {conductor: mockTimeConductor},
                    mockConductorViewService,
                    mockFormatService,
                    "fixed",
                    true
                );

                spyOn(controller, "setMode");
                spyOn(controller, "selectTimeSystemByKey");
            });

            it("sets conductor state from URL", function () {
                mockSearchObject["tc.mode"] = "fixed";
                controller.setStateFromSearchParams(mockSearchObject);
                expect(controller.selectTimeSystemByKey).toHaveBeenCalledWith("otherTimeSystem");
                expect(mockTimeConductor.bounds).toHaveBeenCalledWith(urlBounds);
            });

            it("sets mode from URL", function () {
                mockTimeConductor.bounds.reset();
                mockSearchObject["tc.mode"] = "realtime";
                controller.setStateFromSearchParams(mockSearchObject);
                expect(controller.setMode).toHaveBeenCalledWith("realtime");
                expect(controller.selectTimeSystemByKey).toHaveBeenCalledWith("otherTimeSystem");
                expect(mockConductorViewService.deltas).toHaveBeenCalledWith(urlDeltas);
                expect(mockTimeConductor.bounds).not.toHaveBeenCalled();
            });

            describe("when conductor state changes", function () {
                it("updates the URL with the mode", function () {
                    controller.setMode("realtime", "fixed");
                    expect(mockLocation.search).toHaveBeenCalledWith("tc.mode", "fixed");
                });

                it("updates the URL with the bounds", function () {
                    mockConductorViewService.mode.and.returnValue("fixed");
                    controller.changeBounds({start: 500, end: 600});
                    expect(mockLocation.search).toHaveBeenCalledWith("tc.startBound", 500);
                    expect(mockLocation.search).toHaveBeenCalledWith("tc.endBound", 600);
                });

                it("updates the URL with the deltas", function () {
                    controller.setDeltas({startDelta: 700, endDelta: 800});
                    expect(mockLocation.search).toHaveBeenCalledWith("tc.startDelta", 700);
                    expect(mockLocation.search).toHaveBeenCalledWith("tc.endDelta", 800);
                });

                it("updates the URL with the time system", function () {
                    controller.changeTimeSystem(otherTimeSystem);
                    expect(mockLocation.search).toHaveBeenCalledWith("tc.timeSystem", "otherTimeSystem");
                });
            });
        });
    });
});
