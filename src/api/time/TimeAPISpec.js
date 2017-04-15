/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

define(['./TimeAPI'], function (TimeAPI) {
    describe("The Time API", function () {
        var api,
            timeSystemKey,
            timeSystem,
            bounds,
            eventListener,
            toi,
            follow;

        beforeEach(function () {
            api = new TimeAPI();
            timeSystemKey = "timeSystemKey";
            timeSystem = {key: timeSystemKey};
            bounds = {start: 0, end: 0};
            eventListener = jasmine.createSpy("eventListener");
            toi = 111;
            follow = true;
        });

        it("Supports setting and querying of time of interest", function () {
            expect(api.timeOfInterest()).not.toBe(toi);
            api.timeOfInterest(toi);
            expect(api.timeOfInterest()).toBe(toi);
        });

        it("Allows setting of valid bounds", function () {
            bounds = {start: 0, end: 1};
            expect(api.bounds()).not.toBe(bounds);
            expect(api.bounds.bind(api, bounds)).not.toThrow();
            expect(api.bounds()).toEqual(bounds);
        });

        it("Disallows setting of invalid bounds", function () {
            bounds = {start: 1, end: 0};
            expect(api.bounds()).not.toEqual(bounds);
            expect(api.bounds.bind(api, bounds)).toThrow();
            expect(api.bounds()).not.toEqual(bounds);

            bounds = {start: 1};
            expect(api.bounds()).not.toEqual(bounds);
            expect(api.bounds.bind(api, bounds)).toThrow();
            expect(api.bounds()).not.toEqual(bounds);
        });

        it("Allows setting of previously registered time system with bounds", function () {
            api.addTimeSystem(timeSystem);
            expect(api.timeSystem()).not.toBe(timeSystemKey);
            expect(function() {
                api.timeSystem(timeSystemKey, bounds);
            }).not.toThrow();
            expect(api.timeSystem()).toBe(timeSystemKey);
        });

        it("Disallows setting of time system without bounds", function () {
            api.addTimeSystem(timeSystem);
            expect(api.timeSystem()).not.toBe(timeSystemKey);
            expect(function () {
                api.timeSystem(timeSystemKey)
            }).toThrow();
            expect(api.timeSystem()).not.toBe(timeSystemKey);
        });

        it("Emits an event when time system changes", function () {
            api.addTimeSystem(timeSystem);
            expect(eventListener).not.toHaveBeenCalled();
            api.on("timeSystem", eventListener);
            api.timeSystem(timeSystemKey, bounds);
            expect(eventListener).toHaveBeenCalledWith(timeSystemKey);
        });

        it("Emits an event when time of interest changes", function () {
            expect(eventListener).not.toHaveBeenCalled();
            api.on("timeOfInterest", eventListener);
            api.timeOfInterest(toi);
            expect(eventListener).toHaveBeenCalledWith(toi);
        });

        it("Emits an event when bounds change", function () {
            expect(eventListener).not.toHaveBeenCalled();
            api.on("bounds", eventListener);
            api.bounds(bounds);
            expect(eventListener).toHaveBeenCalledWith(bounds, false);
        });

        it("If bounds are set and TOI lies inside them, do not change TOI", function () {
            api.timeOfInterest(6);
            api.bounds({start: 1, end: 10});
            expect(api.timeOfInterest()).toEqual(6);
        });

        it("If bounds are set and TOI lies outside them, reset TOI", function () {
            api.timeOfInterest(11);
            api.bounds({start: 1, end: 10});
            expect(api.timeOfInterest()).toBeUndefined();
        });

        it("Maintains delta during tick", function () {
        });


        it("Allows registered time system to be activated", function () {
        });

        it("Allows a registered tick source to be activated", function () {
            var mockTickSource = jasmine.createSpyObj("mockTickSource", [
                "on",
                "off",
                "currentValue"
            ]);
            mockTickSource.key = 'mockTickSource'
        });

        describe(" when enabling a tick source", function () {
            var mockTickSource;
            var anotherMockTickSource;
            var mockOffsets = {
                start: 0,
                end: 0
            }

            beforeEach(function () {
                mockTickSource = jasmine.createSpyObj("clock", [
                    "on",
                    "off"
                ]);
                mockTickSource.key = "mts";

                anotherMockTickSource = jasmine.createSpyObj("clock", [
                    "on",
                    "off"
                ]);
                anotherMockTickSource.key = "amts";

                api.addClock(mockTickSource);
                api.addClock(anotherMockTickSource);
            });

            it("a new tick listener is registered", function () {
                api.clock("mts", mockOffsets);
                expect(mockTickSource.on).toHaveBeenCalledWith("tick", jasmine.any(Function));
            });

            it("listener of existing tick source is reregistered", function () {
                api.clock("mts", mockOffsets);
                api.clock("amts", mockOffsets);
                expect(mockTickSource.off).toHaveBeenCalledWith("tick", jasmine.any(Function));
            });

            it("Follow correctly reflects whether the conductor is following a " +
                "tick source", function () {
                expect(api.follow()).toBe(false);
                api.clock("mts", mockOffsets);
                expect(api.follow()).toBe(true);
                api.stopClock();
                expect(api.follow()).toBe(false);
            });

            it("emits an event when follow mode changes", function () {
                var callback = jasmine.createSpy("followCallback");
                expect(api.follow()).toBe(false);

                api.on("follow", callback);
            });

        });

        it("on tick, observes deltas, and indicates tick in bounds callback", function () {
            var mockTickSource = jasmine.createSpyObj("clock", [
                "on",
                "off"
            ]);
            var tickCallback;
            var boundsCallback = jasmine.createSpy("boundsCallback");
            var clockOffsets = {
                start: -100,
                end: 100
            };
            mockTickSource.key = "mts";

            api.addClock(mockTickSource);
            api.clock("mts", clockOffsets);

            api.on("bounds", boundsCallback);

            tickCallback = mockTickSource.on.mostRecentCall.args[1]
            tickCallback(1000);
            expect(boundsCallback).toHaveBeenCalledWith({
                start: 900,
                end: 1100
            }, true);
        });
    });
});
