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

define([
    './TimeSettingsURLHandler',
    '../../api/time/TimeAPI'
], function (
    TimeSettingsURLHandler,
    TimeAPI
) {
    describe("TimeSettingsURLHandler", function () {
        var time;
        var $location;
        var $rootScope;
        var search;
        var handler; // eslint-disable-line
        var clockA;
        var clockB;
        var timeSystemA;
        var timeSystemB;
        var boundsA;
        var boundsB;
        var offsetsA;
        var offsetsB;
        var initialize;
        var triggerLocationChange;

        beforeEach(function () {
            clockA = jasmine.createSpyObj('clockA', ['on', 'off']);
            clockA.key = 'clockA';
            clockA.currentValue = function () {
                return 1000;
            };

            clockB = jasmine.createSpyObj('clockB', ['on', 'off']);
            clockB.key = 'clockB';
            clockB.currentValue = function () {
                return 2000;
            };

            timeSystemA = {key: 'timeSystemA'};
            timeSystemB = {key: 'timeSystemB'};
            boundsA = {
                start: 10,
                end: 20
            };
            boundsB = {
                start: 120,
                end: 360
            };
            offsetsA = {
                start: -100,
                end: 0
            };
            offsetsB = {
                start: -50,
                end: 50
            };

            time = new TimeAPI();

            [
                'on',
                'bounds',
                'clockOffsets',
                'timeSystem',
                'clock',
                'stopClock'
            ].forEach(function (method) {
                spyOn(time, method).and.callThrough();
            });
            time.addTimeSystem(timeSystemA);
            time.addTimeSystem(timeSystemB);
            time.addClock(clockA);
            time.addClock(clockB);

            $location = jasmine.createSpyObj('$location', [
                'search'
            ]);
            $rootScope = jasmine.createSpyObj('$rootScope', [
                '$on'
            ]);

            search = {};
            $location.search.and.callFake(function (key, value) {
                if (arguments.length === 0) {
                    return search;
                }

                if (value === null) {
                    delete search[key];
                } else {
                    search[key] = String(value);
                }

                return this;
            });

            expect(time.timeSystem()).toBeUndefined();
            expect(time.bounds()).toEqual({});
            expect(time.clockOffsets()).toBeUndefined();
            expect(time.clock()).toBeUndefined();

            initialize = function () {
                handler = new TimeSettingsURLHandler(
                    time,
                    $location,
                    $rootScope
                );
                expect($rootScope.$on).toHaveBeenCalledWith(
                    '$locationChangeSuccess',
                    jasmine.any(Function)
                );
                triggerLocationChange = $rootScope.$on.calls.mostRecent().args[1];

            };
        });

        it("initializes with missing time system", function () {
            // This handles an odd transitory case where a url does not include
            // a timeSystem.  It's generally only experienced by those who
            // based their code on the tutorial before it specified a time
            // system.
            search['tc.mode'] = 'clockA';
            search['tc.timeSystem'] = undefined;
            search['tc.startDelta'] = '123';
            search['tc.endDelta'] = '456';

            // We don't specify behavior right now other than "don't break."
            expect(initialize).not.toThrow();
        });

        it("can initalize fixed mode from location", function () {
            search['tc.mode'] = 'fixed';
            search['tc.timeSystem'] = 'timeSystemA';
            search['tc.startBound'] = '123';
            search['tc.endBound'] = '456';

            initialize();

            expect(time.timeSystem).toHaveBeenCalledWith(
                'timeSystemA',
                {
                    start: 123,
                    end: 456
                }
            );
        });

        it("can initialize clock mode from location", function () {
            search['tc.mode'] = 'clockA';
            search['tc.timeSystem'] = 'timeSystemA';
            search['tc.startDelta'] = '123';
            search['tc.endDelta'] = '456';

            initialize();

            expect(time.clock).toHaveBeenCalledWith(
                'clockA',
                {
                    start: -123,
                    end: 456
                }
            );
            expect(time.timeSystem).toHaveBeenCalledWith(
                'timeSystemA'
            );
        });

        it("can initialize fixed mode from time API", function () {
            time.timeSystem(timeSystemA.key, boundsA);
            initialize();
            expect($location.search)
                .toHaveBeenCalledWith('tc.mode', 'fixed');
            expect($location.search)
                .toHaveBeenCalledWith('tc.timeSystem', 'timeSystemA');
            expect($location.search)
                .toHaveBeenCalledWith('tc.startBound', 10);
            expect($location.search)
                .toHaveBeenCalledWith('tc.endBound', 20);
            expect($location.search)
                .toHaveBeenCalledWith('tc.startDelta', null);
            expect($location.search)
                .toHaveBeenCalledWith('tc.endDelta', null);
        });

        it("can initialize clock mode from time API", function () {
            time.clock(clockA.key, offsetsA);
            time.timeSystem(timeSystemA.key);
            initialize();
            expect($location.search)
                .toHaveBeenCalledWith('tc.mode', 'clockA');
            expect($location.search)
                .toHaveBeenCalledWith('tc.timeSystem', 'timeSystemA');
            expect($location.search)
                .toHaveBeenCalledWith('tc.startBound', null);
            expect($location.search)
                .toHaveBeenCalledWith('tc.endBound', null);
            expect($location.search)
                .toHaveBeenCalledWith('tc.startDelta', 100);
            expect($location.search)
                .toHaveBeenCalledWith('tc.endDelta', 0);
        });

        describe('location changes in fixed mode', function () {

            beforeEach(function () {
                time.timeSystem(timeSystemA.key, boundsA);
                initialize();
                time.timeSystem.calls.reset();
                time.bounds.calls.reset();
                time.clock.calls.reset();
                time.stopClock.calls.reset();
            });

            it("does not change on spurious location change", function () {
                triggerLocationChange();
                expect(time.timeSystem).not.toHaveBeenCalledWith(
                    'timeSystemA',
                    jasmine.any(Object)
                );
                expect(time.bounds).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
                expect(time.stopClock).not.toHaveBeenCalled();
            });

            it("updates timeSystem changes", function () {
                search['tc.timeSystem'] = 'timeSystemB';
                triggerLocationChange();
                expect(time.timeSystem).toHaveBeenCalledWith(
                    'timeSystemB',
                    {
                        start: 10,
                        end: 20
                    }
                );
            });

            it("updates bounds changes", function () {
                search['tc.startBound'] = '100';
                search['tc.endBound'] = '200';
                triggerLocationChange();
                expect(time.timeSystem).not.toHaveBeenCalledWith(
                    jasmine.anything(), jasmine.anything()
                );
                expect(time.bounds).toHaveBeenCalledWith({
                    start: 100,
                    end: 200
                });
                search['tc.endBound'] = '300';
                triggerLocationChange();
                expect(time.timeSystem).not.toHaveBeenCalledWith(
                    jasmine.anything(), jasmine.anything()
                );
                expect(time.bounds).toHaveBeenCalledWith({
                    start: 100,
                    end: 300
                });
            });

            it("updates clock mode w/o timeSystem change", function () {
                search['tc.mode'] = 'clockA';
                search['tc.startDelta'] = '50';
                search['tc.endDelta'] = '50';
                delete search['tc.endBound'];
                delete search['tc.startBound'];
                triggerLocationChange();
                expect(time.clock).toHaveBeenCalledWith(
                    'clockA',
                    {
                        start: -50,
                        end: 50
                    }
                );
                expect(time.timeSystem).not.toHaveBeenCalledWith(
                    jasmine.anything(), jasmine.anything()
                );
            });

            it("updates clock mode and timeSystem", function () {
                search['tc.mode'] = 'clockA';
                search['tc.startDelta'] = '50';
                search['tc.endDelta'] = '50';
                search['tc.timeSystem'] = 'timeSystemB';
                delete search['tc.endBound'];
                delete search['tc.startBound'];
                triggerLocationChange();
                expect(time.clock).toHaveBeenCalledWith(
                    'clockA',
                    {
                        start: -50,
                        end: 50
                    }
                );
                expect(time.timeSystem).toHaveBeenCalledWith('timeSystemB');
            });
        });

        describe('location changes in clock mode', function () {

            beforeEach(function () {
                time.clock(clockA.key, offsetsA);
                time.timeSystem(timeSystemA.key);
                initialize();
                time.timeSystem.calls.reset();
                time.bounds.calls.reset();
                time.clock.calls.reset();
                time.clockOffsets.calls.reset();
                time.stopClock.calls.reset();
            });

            it("does not change on spurious location change", function () {
                triggerLocationChange();
                expect(time.timeSystem).not.toHaveBeenCalledWith(
                    'timeSystemA',
                    jasmine.any(Object)
                );
                expect(time.clockOffsets).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
                expect(time.clock).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
                expect(time.bounds).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
            });

            it("changes time system", function () {
                search['tc.timeSystem'] = 'timeSystemB';
                triggerLocationChange();
                expect(time.timeSystem).toHaveBeenCalledWith(
                    'timeSystemB'
                );
                expect(time.clockOffsets).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
                expect(time.clock).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
                expect(time.stopClock).not.toHaveBeenCalled();
                expect(time.bounds).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
            });

            it("changes offsets", function () {
                search['tc.startDelta'] = '50';
                search['tc.endDelta'] = '50';
                triggerLocationChange();
                expect(time.timeSystem).not.toHaveBeenCalledWith(
                    'timeSystemA',
                    jasmine.any(Object)
                );
                expect(time.clockOffsets).toHaveBeenCalledWith(
                    {
                        start: -50,
                        end: 50
                    }
                );
                expect(time.clock).not.toHaveBeenCalledWith(
                    jasmine.any(Object)
                );
            });

            it("updates to fixed w/o timeSystem change", function () {
                search['tc.mode'] = 'fixed';
                search['tc.startBound'] = '234';
                search['tc.endBound'] = '567';
                delete search['tc.endDelta'];
                delete search['tc.startDelta'];

                triggerLocationChange();
                expect(time.stopClock).toHaveBeenCalled();
                expect(time.bounds).toHaveBeenCalledWith({
                    start: 234,
                    end: 567
                });
                expect(time.timeSystem).not.toHaveBeenCalledWith(
                    jasmine.anything(), jasmine.anything()
                );
            });

            it("updates fixed and timeSystem", function () {
                search['tc.mode'] = 'fixed';
                search['tc.startBound'] = '234';
                search['tc.endBound'] = '567';
                search['tc.timeSystem'] = 'timeSystemB';
                delete search['tc.endDelta'];
                delete search['tc.startDelta'];

                triggerLocationChange();
                expect(time.stopClock).toHaveBeenCalled();
                expect(time.timeSystem).toHaveBeenCalledWith(
                    'timeSystemB',
                    {
                        start: 234,
                        end: 567
                    }
                );
            });

            it("updates clock", function () {
                search['tc.mode'] = 'clockB';
                triggerLocationChange();
                expect(time.clock).toHaveBeenCalledWith(
                    'clockB',
                    {
                        start: -100,
                        end: 0
                    }
                );
                expect(time.timeSystem).not.toHaveBeenCalledWith(jasmine.anything());
            });

            it("updates clock and timeSystem", function () {
                search['tc.mode'] = 'clockB';
                search['tc.timeSystem'] = 'timeSystemB';
                triggerLocationChange();
                expect(time.clock).toHaveBeenCalledWith(
                    'clockB',
                    {
                        start: -100,
                        end: 0
                    }
                );
                expect(time.timeSystem).toHaveBeenCalledWith(
                    'timeSystemB'
                );
            });

            it("updates clock and timeSystem and offsets", function () {
                search['tc.mode'] = 'clockB';
                search['tc.timeSystem'] = 'timeSystemB';
                search['tc.startDelta'] = '50';
                search['tc.endDelta'] = '50';
                triggerLocationChange();
                expect(time.clock).toHaveBeenCalledWith(
                    'clockB',
                    {
                        start: -50,
                        end: 50
                    }
                );
                expect(time.timeSystem).toHaveBeenCalledWith(
                    'timeSystemB'
                );
            });

            it("stops the clock", function () {
                // this is a robustness test, unsure if desired, requires
                // user to be manually editing location strings.
                search['tc.mode'] = 'fixed';
                triggerLocationChange();
                expect(time.stopClock).toHaveBeenCalled();
            });
        });

        describe("location updates from time API in fixed", function () {
            beforeEach(function () {
                time.timeSystem(timeSystemA.key, boundsA);
                initialize();
            });

            it("updates on bounds change", function () {
                time.bounds(boundsB);
                expect(search).toEqual({
                    'tc.mode': 'fixed',
                    'tc.startBound': '120',
                    'tc.endBound': '360',
                    'tc.timeSystem': 'timeSystemA'
                });
            });

            it("updates on timeSystem change", function () {
                time.timeSystem(timeSystemB, boundsA);
                expect(search).toEqual({
                    'tc.mode': 'fixed',
                    'tc.startBound': '10',
                    'tc.endBound': '20',
                    'tc.timeSystem': 'timeSystemB'
                });
                time.timeSystem(timeSystemA, boundsB);
                expect(search).toEqual({
                    'tc.mode': 'fixed',
                    'tc.startBound': '120',
                    'tc.endBound': '360',
                    'tc.timeSystem': 'timeSystemA'
                });
            });

            it("Updates to clock", function () {
                time.clock(clockA, offsetsA);
                expect(search).toEqual({
                    'tc.mode': 'clockA',
                    'tc.startDelta': '100',
                    'tc.endDelta': '0',
                    'tc.timeSystem': 'timeSystemA'
                });
            });
        });

        describe("location updates from time API in fixed", function () {
            beforeEach(function () {
                time.clock(clockA.key, offsetsA);
                time.timeSystem(timeSystemA.key);
                initialize();
            });

            it("updates offsets", function () {
                time.clockOffsets(offsetsB);
                expect(search).toEqual({
                    'tc.mode': 'clockA',
                    'tc.startDelta': '50',
                    'tc.endDelta': '50',
                    'tc.timeSystem': 'timeSystemA'
                });
            });

            it("updates clocks", function () {
                time.clock(clockB, offsetsA);
                expect(search).toEqual({
                    'tc.mode': 'clockB',
                    'tc.startDelta': '100',
                    'tc.endDelta': '0',
                    'tc.timeSystem': 'timeSystemA'
                });
                time.clock(clockA, offsetsB);
                expect(search).toEqual({
                    'tc.mode': 'clockA',
                    'tc.startDelta': '50',
                    'tc.endDelta': '50',
                    'tc.timeSystem': 'timeSystemA'
                });
            });

            it("updates timesystems", function () {
                time.timeSystem(timeSystemB);
                expect(search).toEqual({
                    'tc.mode': 'clockA',
                    'tc.startDelta': '100',
                    'tc.endDelta': '0',
                    'tc.timeSystem': 'timeSystemB'
                });
            });

            it("stops the clock", function () {
                time.stopClock();
                expect(search).toEqual({
                    'tc.mode': 'fixed',
                    'tc.startBound': '900',
                    'tc.endBound': '1000',
                    'tc.timeSystem': 'timeSystemA'
                });
            });
        });
    });
});
