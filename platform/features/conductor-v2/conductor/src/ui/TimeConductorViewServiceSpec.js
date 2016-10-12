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

define(['./TimeConductorViewService'], function (TimeConductorViewService) {
    describe("The Time Conductor view service", function () {
        var mockTimeConductor;
        var basicTimeSystem;
        var tickingTimeSystem;
        var viewService;
        var tickingTimeSystemDefaults;

        function mockConstructor(object) {
            return function () {
                return object;
            };
        }

        beforeEach(function () {
            mockTimeConductor = jasmine.createSpyObj("timeConductor", [
               "timeSystem",
                "bounds",
                "follow",
                "on",
                "off"
            ]);

            basicTimeSystem = jasmine.createSpyObj("basicTimeSystem", [
               "tickSources",
                "defaults"
            ]);
            basicTimeSystem.metadata = {
                key: "basic"
            };
            basicTimeSystem.tickSources.andReturn([]);
            basicTimeSystem.defaults.andReturn({
                bounds: {
                    start: 0,
                    end: 1
                },
                deltas: {
                    start: 0,
                    end: 0
                }
            });
            //Initialize conductor
            mockTimeConductor.timeSystem.andReturn(basicTimeSystem);
            mockTimeConductor.bounds.andReturn({start: 0, end: 1});

            tickingTimeSystem = jasmine.createSpyObj("tickingTimeSystem", [
                "tickSources",
                "defaults"
            ]);
            tickingTimeSystem.metadata = {
                key: "ticking"
            };
            tickingTimeSystemDefaults = {
                bounds: {
                    start: 100,
                    end: 200
                },
                deltas: {
                    start: 1000,
                    end: 500
                }
            };
            tickingTimeSystem.defaults.andReturn(tickingTimeSystemDefaults);
        });

        it("At a minimum supports fixed mode", function () {
            var mockTimeSystems = [mockConstructor(basicTimeSystem)];
            viewService = new TimeConductorViewService(mockTimeConductor, mockTimeSystems);

            var availableModes = viewService.availableModes();
            expect(availableModes.fixed).toBeDefined();
        });

        it("Supports realtime mode if appropriate tick source(s) availables", function () {
            var mockTimeSystems = [mockConstructor(tickingTimeSystem)];
            var mockRealtimeTickSource = {
                metadata: {
                    mode: 'realtime'
                }
            };
            tickingTimeSystem.tickSources.andReturn([mockRealtimeTickSource]);

            viewService = new TimeConductorViewService(mockTimeConductor, mockTimeSystems);

            var availableModes = viewService.availableModes();
            expect(availableModes.realtime).toBeDefined();
        });

        it("Supports LAD mode if appropriate tick source(s) available", function () {
            var mockTimeSystems = [mockConstructor(tickingTimeSystem)];
            var mockLADTickSource = {
                metadata: {
                    mode: 'lad'
                }
            };
            tickingTimeSystem.tickSources.andReturn([mockLADTickSource]);

            viewService = new TimeConductorViewService(mockTimeConductor, mockTimeSystems);

            var availableModes = viewService.availableModes();
            expect(availableModes.lad).toBeDefined();
        });

        describe("when mode is changed", function () {

            it("destroys previous mode", function () {
                var mockTimeSystems = [mockConstructor(basicTimeSystem)];

                var oldMode = jasmine.createSpyObj("conductorMode", [
                    "destroy"
                ]);

                viewService = new TimeConductorViewService(mockTimeConductor, mockTimeSystems);
                viewService.currentMode = oldMode;
                viewService.mode('fixed');
                expect(oldMode.destroy).toHaveBeenCalled();
            });

            describe("the time system", function () {
                it("is retained if available in new mode", function () {
                    var mockTimeSystems = [mockConstructor(basicTimeSystem), mockConstructor(tickingTimeSystem)];
                    var mockRealtimeTickSource = {
                        metadata: {
                            mode: 'realtime'
                        },
                        listen: function () {}
                    };
                    tickingTimeSystem.tickSources.andReturn([mockRealtimeTickSource]);

                    viewService = new TimeConductorViewService(mockTimeConductor, mockTimeSystems);

                    //Set time system to one known to support realtime mode
                    mockTimeConductor.timeSystem.andReturn(tickingTimeSystem);

                    //Select realtime mode
                    mockTimeConductor.timeSystem.reset();
                    viewService.mode('realtime');
                    expect(mockTimeConductor.timeSystem).not.toHaveBeenCalledWith(tickingTimeSystem, tickingTimeSystemDefaults.bounds);
                });
                it("is defaulted if selected time system not available in new mode", function () {
                    var mockTimeSystems = [mockConstructor(basicTimeSystem), mockConstructor(tickingTimeSystem)];
                    var mockRealtimeTickSource = {
                        metadata: {
                            mode: 'realtime'
                        },
                        listen: function () {}
                    };
                    tickingTimeSystem.tickSources.andReturn([mockRealtimeTickSource]);

                    viewService = new TimeConductorViewService(mockTimeConductor, mockTimeSystems);

                    //Set time system to one known to not support realtime mode
                    mockTimeConductor.timeSystem.andReturn(basicTimeSystem);

                    //Select realtime mode
                    mockTimeConductor.timeSystem.reset();
                    viewService.mode('realtime');
                    expect(mockTimeConductor.timeSystem).toHaveBeenCalledWith(tickingTimeSystem, tickingTimeSystemDefaults.bounds);
                });
            });
        });
    });
});
