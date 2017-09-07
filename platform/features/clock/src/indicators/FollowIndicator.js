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

define(
    ['moment'],
    function (moment) {
        var NO_TIMER = "No timer being followed.";

        /**
         * Indicator that displays the active timer, as well as its
         * current state.
         * @implements {Indicator}
         * @memberof platform/features/clock
         */
        function FollowIndicator(timerService) {
            this.timerService = timerService;
        }

        FollowIndicator.prototype.getGlyphClass = function () {
            return "";
        };

        FollowIndicator.prototype.getCssClass = function () {
            return "icon-clock";
        };

        FollowIndicator.prototype.getText = function () {
            var timer = this.timerService.getTimer();
            return timer ? timer.getModel().name : NO_TIMER;
        };

        FollowIndicator.prototype.getDescription = function () {
            return "";
        };

        return FollowIndicator;
    }
);
