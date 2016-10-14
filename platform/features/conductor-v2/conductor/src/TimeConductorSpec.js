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

define(['./TimeConductor'], function (TimeConductor) {
    describe("The Time Conductor", function () {
        var tc,
            timeSystem,
            bounds,
            eventListener,
            toi,
            follow;

        beforeEach(function () {
            tc = new TimeConductor();
            timeSystem = {};
            bounds = {start: 0, end: 0};
            eventListener = jasmine.createSpy("eventListener");
            toi = 111;
            follow = true;
        });

        it("Supports setting and querying of time of interest and and follow mode", function () {
            expect(tc.timeOfInterest()).not.toBe(toi);
            tc.timeOfInterest(toi);
            expect(tc.timeOfInterest()).toBe(toi);

            expect(tc.follow()).not.toBe(follow);
            tc.follow(follow);
            expect(tc.follow()).toBe(follow);
        });

        it("Allows setting of valid bounds", function () {
            bounds = {start: 0, end: 1};
            expect(tc.bounds()).not.toEqual(bounds);
            expect(tc.bounds.bind(tc, bounds)).not.toThrow();
            expect(tc.bounds()).toEqual(bounds);
        });

        it("Disallows setting of invalid bounds", function () {
            bounds = {start: 1, end: 0};
            expect(tc.bounds()).not.toEqual(bounds);
            expect(tc.bounds.bind(tc, bounds)).toThrow();
            expect(tc.bounds()).not.toEqual(bounds);

            bounds = {start: 1};
            expect(tc.bounds()).not.toEqual(bounds);
            expect(tc.bounds.bind(tc, bounds)).toThrow();
            expect(tc.bounds()).not.toEqual(bounds);
        });

        it("Allows setting of time system with bounds", function () {
            expect(tc.timeSystem()).not.toBe(timeSystem);
            expect(tc.timeSystem.bind(tc, timeSystem, bounds)).not.toThrow();
            expect(tc.timeSystem()).toBe(timeSystem);
        });

        it("Disallows setting of time system without bounds", function () {
            expect(tc.timeSystem()).not.toBe(timeSystem);
            expect(tc.timeSystem.bind(tc, timeSystem)).toThrow();
            expect(tc.timeSystem()).not.toBe(timeSystem);
        });

        it("Emits an event when time system changes", function () {
            expect(eventListener).not.toHaveBeenCalled();
            tc.on("timeSystem", eventListener);
            tc.timeSystem(timeSystem, bounds);
            expect(eventListener).toHaveBeenCalledWith(timeSystem);
        });

        it("Emits an event when time of interest changes", function () {
            expect(eventListener).not.toHaveBeenCalled();
            tc.on("timeOfInterest", eventListener);
            tc.timeOfInterest(toi);
            expect(eventListener).toHaveBeenCalledWith(toi);
        });

        it("Emits an event when bounds change", function () {
            expect(eventListener).not.toHaveBeenCalled();
            tc.on("bounds", eventListener);
            tc.bounds(bounds);
            expect(eventListener).toHaveBeenCalledWith(bounds);
        });

        it("Emits an event when follow mode changes", function () {
            expect(eventListener).not.toHaveBeenCalled();
            tc.on("follow", eventListener);
            tc.follow(follow);
            expect(eventListener).toHaveBeenCalledWith(follow);
        });
    });
});
