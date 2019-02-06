/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    '../../src/services/TimerService'
], function (TimerService) {
    describe("TimerService", function () {
        var callback;
        var mockmct;
        var timerService;

        beforeEach(function () {
            callback = jasmine.createSpy('callback');
            mockmct = {
                time: { clock: jasmine.createSpy('clock') },
                objects: { observe: jasmine.createSpy('observe') }
            };
            timerService = new TimerService(mockmct);
            timerService.on('change', callback);
        });

        it("initially emits no change events", function () {
            expect(callback).not.toHaveBeenCalled();
        });

        it("reports no current timer", function () {
            expect(timerService.getTimer()).toBeUndefined();
        });

        describe("setTimer", function () {
            var testTimer;

            beforeEach(function () {
                testTimer = { name: "I am some timer; you are nobody." };
                timerService.setTimer(testTimer);
            });

            it("emits a change event", function () {
                expect(callback).toHaveBeenCalled();
            });

            it("reports the current timer", function () {
                expect(timerService.getTimer()).toBe(testTimer);
            });

            it("observes changes to an object", function () {
                var newTimer = { name: "I am another timer." };
                expect(mockmct.objects.observe).toHaveBeenCalledWith(
                    testTimer,
                    '*',
                    jasmine.any(Function)
                );
                mockmct.objects.observe.calls.mostRecent().args[2](newTimer);
                expect(timerService.getTimer()).toBe(newTimer);
            });
        });
    });
});
