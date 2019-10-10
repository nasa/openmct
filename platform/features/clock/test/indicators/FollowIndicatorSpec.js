/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2018, United States Government
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
    "../../src/indicators/FollowIndicator",
    "../../src/services/TimerService",
    "../../../../../src/MCT",
    'zepto'
], function (
    FollowIndicator,
    TimerService,
    MCT,
    $
) {
    xdescribe("The timer-following indicator", function () {
        var timerService;
        var openmct;

        beforeEach(function () {
            openmct = new MCT();
            timerService = new TimerService(openmct);
            spyOn(openmct.indicators, "add");
        });

        it("adds an indicator when installed", function () {
            FollowIndicator(openmct, timerService);
            expect(openmct.indicators.add).toHaveBeenCalled();
        });

        it("indicates that no timer is being followed", function () {
            FollowIndicator(openmct, timerService);
            var simpleIndicator = openmct.indicators.add.calls.mostRecent().args[0];
            var element = simpleIndicator.element;
            var text = $('.indicator-text', element).text().trim();
            expect(text).toEqual('No timer being followed');
        });

        describe("when a timer is set", function () {
            var testObject;
            var simpleIndicator;

            beforeEach(function () {
                testObject = {
                    identifier: {
                        namespace: 'namespace',
                        key: 'key'
                    },
                    name: "some timer!"
                };
                timerService.setTimer(testObject);
                FollowIndicator(openmct, timerService);
                simpleIndicator = openmct.indicators.add.calls.mostRecent().args[0];
            });

            it("displays the timer's name", function () {
                var element = simpleIndicator.element;
                var text = $('.indicator-text', element).text().trim();
                expect(text).toEqual('Following timer ' + testObject.name);
            });

            it("displays the timer's name when it changes", function () {
                var secondTimer = {
                    identifier: {
                        namespace: 'namespace',
                        key: 'key2'
                    },
                    name: "Some other timer"
                };
                var element = simpleIndicator.element;
                timerService.setTimer(secondTimer);
                var text = $('.indicator-text', element).text().trim();
                expect(text).toEqual('Following timer ' + secondTimer.name);
            });

        });
    });
});
