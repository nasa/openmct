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

define(["../../src/indicators/FollowIndicator"], function (FollowIndicator) {
    var TIMER_SERVICE_METHODS =
        ['setTimer', 'getTimer', 'clearTimer', 'on', 'off'];

    describe("The timer-following indicator", function () {
        var mockTimerService;
        var indicator;

        beforeEach(function () {
            mockTimerService =
                jasmine.createSpyObj('timerService', TIMER_SERVICE_METHODS);
            indicator = new FollowIndicator(mockTimerService);
        });

        it("implements the Indicator interface", function () {
            expect(indicator.getGlyphClass()).toEqual(jasmine.any(String));
            expect(indicator.getCssClass()).toEqual(jasmine.any(String));
            expect(indicator.getText()).toEqual(jasmine.any(String));
            expect(indicator.getDescription()).toEqual(jasmine.any(String));
        });

        describe("when a timer is set", function () {
            var testModel;
            var mockDomainObject;

            beforeEach(function () {
                testModel = { name: "some timer!" };
                mockDomainObject = jasmine.createSpyObj('timer', ['getModel']);
                mockDomainObject.getModel.andReturn(testModel);
                mockTimerService.getTimer.andReturn(mockDomainObject);
            });

            it("displays the timer's name", function () {
                expect(indicator.getText().indexOf(testModel.name))
                    .not.toEqual(-1);
            });
        });
    });
});
