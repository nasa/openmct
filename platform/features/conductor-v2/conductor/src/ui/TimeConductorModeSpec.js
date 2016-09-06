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

define(['./TimeConductorMode'], function (TimeConductorMode) {
    describe("The Time Conductor Mode", function () {
        var mockTimeConductor,
            fixedModeMetaData,
            mockTimeSystems,
            fixedTimeSystem,

            realtimeModeMetaData,
            realtimeTimeSystem,
            mockTickSource,

            mockBounds,
            mode;

        beforeEach(function () {
            fixedModeMetaData = {
                key: "fixed"
            };
            realtimeModeMetaData = {
                key: "realtime"
            };
            mockBounds = {
                start: 0,
                end: 1
            };

            fixedTimeSystem = jasmine.createSpyObj("timeSystem", [
                "defaults",
                "tickSources"
            ]);
            fixedTimeSystem.tickSources.andReturn([]);

            mockTickSource = jasmine.createSpyObj("tickSource", [
                "listen"
            ]);
            mockTickSource.metadata = {
                mode: "realtime"
            };
            realtimeTimeSystem = jasmine.createSpyObj("realtimeTimeSystem", [
                "defaults",
                "tickSources"
            ]);
            realtimeTimeSystem.tickSources.andReturn([mockTickSource]);

            //Do not return any time systems initially for a default
            // construction configuration that works without any additional work
            mockTimeSystems = [];

            mockTimeConductor = jasmine.createSpyObj("timeConductor", [
                "bounds",
                "timeSystem",
                "on",
                "off",
                "follow"
            ]);
            mockTimeConductor.bounds.andReturn(mockBounds);
        });

        it("Reacts to changes in conductor time system", function () {
            mode = new TimeConductorMode(fixedModeMetaData, mockTimeConductor, mockTimeSystems);
            expect(mockTimeConductor.on).toHaveBeenCalledWith("timeSystem", mode.changeTimeSystem);
        });

        it("Stops listening to time system changes on destroy", function () {
            mode = new TimeConductorMode(fixedModeMetaData, mockTimeConductor, mockTimeSystems);
            mode.destroy();
            expect(mockTimeConductor.off).toHaveBeenCalledWith("timeSystem", mode.changeTimeSystem);
        });

        it("Filters available time systems to those with tick sources that" +
            " support this mode", function () {
            mockTimeSystems = [fixedTimeSystem, realtimeTimeSystem];
            mode = new TimeConductorMode(realtimeModeMetaData, mockTimeConductor, mockTimeSystems);

            var availableTimeSystems = mode.availableTimeSystems();
            expect(availableTimeSystems.length).toBe(1);
            expect(availableTimeSystems.indexOf(fixedTimeSystem)).toBe(-1);
            expect(availableTimeSystems.indexOf(realtimeTimeSystem)).toBe(0);
        });

        describe("Changing the time system", function () {
            var defaults;

            beforeEach(function () {
                defaults = {
                    bounds: {
                        start: 1,
                        end: 2
                    },
                    deltas: {
                        start: 3,
                        end: 4
                    }
                };

                fixedTimeSystem.defaults.andReturn(defaults);

            });
            it ("sets defaults from new time system", function () {
                mode = new TimeConductorMode(fixedModeMetaData, mockTimeConductor, mockTimeSystems);
                spyOn(mode, "deltas");
                mode.deltas.andCallThrough();

                mode.changeTimeSystem(fixedTimeSystem);
                expect(mockTimeConductor.bounds).toHaveBeenCalledWith(defaults.bounds);
                expect(mode.deltas).toHaveBeenCalledWith(defaults.deltas);
            });
            it ("If a tick source is available, sets the tick source", function () {
                mode = new TimeConductorMode(realtimeModeMetaData, mockTimeConductor, mockTimeSystems);
                mode.changeTimeSystem(realtimeTimeSystem);

                var currentTickSource = mode.tickSource();
                expect(currentTickSource).toBe(mockTickSource);
            });
        });

        describe("Setting a tick source", function () {
            var mockUnlistener;

            beforeEach(function () {
                mockUnlistener = jasmine.createSpy("unlistener");
                mockTickSource.listen.andReturn(mockUnlistener);

                mode = new TimeConductorMode(realtimeModeMetaData, mockTimeConductor, mockTimeSystems);
                mode.tickSource(mockTickSource);
            });

            it ("Unlistens from old tick source", function () {
                mode.tickSource(mockTickSource);
                expect(mockUnlistener).toHaveBeenCalled();
            });

            it ("Listens to new tick source", function () {
                expect(mockTickSource.listen).toHaveBeenCalledWith(mode.tick);
            });

            it ("Sets 'follow' state on time conductor", function () {
                expect(mockTimeConductor.follow).toHaveBeenCalledWith(true);
            });

            it ("on destroy, unlistens from tick source", function () {
                mode.destroy();
                expect(mockUnlistener).toHaveBeenCalled();
            });
        });

        describe("setting deltas", function () {
            beforeEach(function () {
                mode = new TimeConductorMode(realtimeModeMetaData, mockTimeConductor, mockTimeSystems);
            });
            it ("sets the bounds on the time conductor based on new delta" +
                " values", function () {
                var deltas = {
                    start: 20,
                    end: 10
                };

                mode.deltas(deltas);

                expect(mockTimeConductor.bounds).toHaveBeenCalledWith({
                    start: mockBounds.end - deltas.start,
                    end: mockBounds.end + deltas.end
                });
            });
        });

        describe("ticking", function () {
            beforeEach(function () {
                mode = new TimeConductorMode(realtimeModeMetaData, mockTimeConductor, mockTimeSystems);
            });
            it ("sets bounds based on current delta values", function () {
                var deltas = {
                    start: 20,
                    end: 10
                };
                var time = 100;

                mode.deltas(deltas);
                mode.tick(time);

                expect(mockTimeConductor.bounds).toHaveBeenCalledWith({
                    start: time - deltas.start,
                    end: time + deltas.end
                });
            });
        });
    });
});
