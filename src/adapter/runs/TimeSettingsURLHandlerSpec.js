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

define(['./TimeSettingsURLHandler'], function (TimeSettingsURLHandler) {
    describe("TimeSettingsURLHandler", function () {
        var time;
        var $location;
        var $rootScope;
        var search;
        var handler;

        beforeEach(function () {
            time = jasmine.createSpyObj('time', [
                'on',
                'bounds',
                'clockOffsets',
                'timeSystem',
                'clock',
                'stopClock'
            ]);
            $location = jasmine.createSpyObj('$location', [
                'search'
            ]);
            $rootScope = jasmine.createSpyObj('$rootScope', [
                '$on'
            ]);

            time.timeSystem.andReturn({ key: 'test-time-system' });

            search = {};
            $location.search.andCallFake(function (key, value) {
                if (arguments.length === 0) {
                    return search;
                }
                if (value === null) {
                    delete search[key]
                } else {
                    search[key] = String(value);
                }
                return this;
            });

            handler = new TimeSettingsURLHandler(
                time,
                $location,
                $rootScope
            );
        });

        ['bounds', 'timeSystem', 'clock', 'clockOffsets'].forEach(function (event) {
            it("listens for " + event + " time events", function () {
                expect(time.on)
                    .toHaveBeenCalledWith(event, jasmine.any(Function));
            });

            describe("when " + event + " time event occurs with no clock", function () {
                var expected;

                beforeEach(function () {
                    expected = {
                        'tc.mode': 'fixed',
                        'tc.timeSystem': 'test-time-system',
                        'tc.startBound': '123',
                        'tc.endBound': '456'
                    };
                    time.clock.andReturn(undefined);
                    time.bounds.andReturn({ start: 123, end: 456 });

                    time.on.calls.forEach(function (call) {
                        if (call.args[0] === event) {
                            call.args[1]();
                        }
                    });
                });

                it("updates query parameters for fixed mode", function () {
                    expect(search).toEqual(expected);
                });
            });

            describe("when " + event + " time event occurs with a clock", function () {
                var expected;

                beforeEach(function () {
                    expected = {
                        'tc.mode': 'clocky',
                        'tc.timeSystem': 'test-time-system',
                        'tc.startDelta': '123',
                        'tc.endDelta': '456'
                    };
                    time.clock.andReturn({ key: 'clocky' });
                    time.clockOffsets.andReturn({ start: -123, end: 456 });

                    time.on.calls.forEach(function (call) {
                        if (call.args[0] === event) {
                            call.args[1]();
                        }
                    });
                });

                it("updates query parameters for realtime mode", function () {
                    expect(search).toEqual(expected);
                });
            });
        });

        it("listens for location changes", function () {
            expect($rootScope.$on)
                .toHaveBeenCalledWith('$locationChangeSuccess', jasmine.any(Function));
        });

    });
});
