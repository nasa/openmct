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

define(["./LocalClock"], function (LocalClock) {
    describe("The LocalClock class", function () {
        var clock,
            mockTimeout,
            timeoutHandle = {};

        beforeEach(function () {
            mockTimeout = jasmine.createSpy("timeout");
            mockTimeout.andReturn(timeoutHandle);
            mockTimeout.cancel = jasmine.createSpy("cancel");

            clock = new LocalClock(mockTimeout, 0);
            clock.start();
        });

        it("calls listeners on tick with current time", function () {
            var mockListener = jasmine.createSpy("listener");
            clock.listen(mockListener);
            clock.tick();
            expect(mockListener).toHaveBeenCalledWith(jasmine.any(Number));
        });

        it("stops ticking when stop is called", function () {
            clock.stop();
            expect(mockTimeout.cancel).toHaveBeenCalledWith(timeoutHandle);
        });
    });
});
