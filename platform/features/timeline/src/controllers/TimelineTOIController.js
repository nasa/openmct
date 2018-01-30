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

define([], function () {

    /**
     * Tracks time-of-interest in timelines, updating both scroll state
     * (when appropriate) and positioning of the displayed line.
     */
    function TimelineTOIController(openmct, timerService, $scope) {
        this.openmct = openmct;
        this.timerService = timerService;
        this.$scope = $scope;

        this.change = this.change.bind(this);
        this.bounds = this.bounds.bind(this);
        this.destroy = this.destroy.bind(this);

        this.timerService.on('change', this.change);
        this.openmct.time.on('bounds', this.bounds);

        this.$scope.$on('$destroy', this.destroy);

        this.$scope.scroll.follow = this.timerService.hasTimer();
        if (this.$scope.zoomController) {
            this.bounds(this.openmct.time.bounds());
        }
    }


    /**
     * Handle a `change` event from the timer service; track the
     * new timer.
     */
    TimelineTOIController.prototype.change = function () {
        this.$scope.scroll.follow =
            this.$scope.scroll.follow || this.timerService.hasTimer();
    };

    /**
     * Handle a `bounds` event from the time API; scroll the timeline
     * to match the current bounds, if currently in follow mode.
     */
    TimelineTOIController.prototype.bounds = function (bounds) {
        if (this.isFollowing()) {
            var start = this.timerService.convert(bounds.start);
            var end = this.timerService.convert(bounds.end);
            this.duration = bounds.end - bounds.start;
            this.$scope.zoomController.bounds(start, end);
        }
    };

    /**
     * Handle a `$destroy` event from scope; detach all observers.
     */
    TimelineTOIController.prototype.destroy = function () {
        this.timerService.off('change', this.change);
        this.openmct.time.off('bounds', this.bounds);
    };

    /**
     * Get the x position of the time-of-interest line,
     * in pixels from the left edge of the timeline area.
     */
    TimelineTOIController.prototype.x = function () {
        var now = this.timerService.now();

        if (now === undefined) {
            return undefined;
        }

        return this.$scope.zoomController.toPixels(this.timerService.now());
    };

    /**
     * Check if there is an active time-of-interest to be shown.
     * @return {boolean} true when active
     */
    TimelineTOIController.prototype.isActive = function () {
        return this.x() !== undefined;
    };

    /**
     * Check if the timeline should be following time conductor bounds.
     * @return {boolean} true when following
     */
    TimelineTOIController.prototype.isFollowing = function () {
        return !!this.$scope.scroll.follow && this.timerService.now() !== undefined;
    };

    return TimelineTOIController;
});
