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

define(
    [
        'moment',
        './TimeConductorValidation'
    ],
    function (moment, TimeConductorValidation) {
        var SEARCH = {
            MODE: 'tc.mode',
            TIME_SYSTEM: 'tc.timeSystem',
            START_BOUND: 'tc.startBound',
            END_BOUND: 'tc.endBound',
            START_DELTA: 'tc.startDelta',
            END_DELTA: 'tc.endDelta'
        };

        var timeUnitsMegastructure = [
            ["Decades", function (r) {
                return r.years() > 15;
            }],
            ["Years", function (r) {
                return r.years() > 1;
            }],
            ["Months", function (r) {
                return r.years() === 1 || r.months() > 1;
            }],
            ["Days", function (r) {
                return r.months() === 1 || r.days() > 1;
            }],
            ["Hours", function (r) {
                return r.days() === 1 || r.hours() > 1;
            }],
            ["Minutes", function (r) {
                return r.hours() === 1 || r.minutes() > 1;
            }],
            ["Seconds", function (r) {
                return r.minutes() === 1 || r.seconds() > 1;
            }],
            ["Milliseconds", function (r) {
                return true;
            }]
        ];

        /**
         * Controller for the Time Conductor UI element. The Time Conductor includes form fields for specifying time
         * bounds and relative time offsets for queries, as well as controls for selection mode, time systems, and zooming.
         * @memberof platform.features.conductor
         * @constructor
         */
        function TimeConductorController(
            $scope,
            $window,
            openmct,
            conductorViewService,
            formatService,
            config
        ) {

            var self = this;

            //Bind all class functions to 'this'
            Object.keys(TimeConductorController.prototype).filter(function (key) {
                return typeof TimeConductorController.prototype[key] === 'function';
            }).forEach(function (key) {
                self[key] = self[key].bind(self);
            });

            this.$scope = $scope;
            this.$window = $window;
            this.conductorViewService = conductorViewService;
            this.timeAPI = openmct.time;
            this.validation = new TimeConductorValidation(this.timeAPI);
            this.formatService = formatService;
            this.config = config;
            this.clocksForTimeSystem = {};
            this.timeSystemsForClocks = {};
            this.$scope.timeSystemModel = {};
            this.$scope.boundsModel = {};

            this.mode = this.timeAPI.clock() === undefined ? 'fixed' : 'realtime';

            var options = this.optionsFromConfig(config);
            this.menu = {
                selected: undefined,
                options: options
            };

            // Construct the provided time system definitions
            this.timeSystems = config.menuOptions.map(function (menuOption){
                return this.getTimeSystem(menuOption.timeSystem);
            }.bind(this));

            //Set the initial state of the UI from the conductor state
            var timeSystem = this.timeAPI.timeSystem();
            if (timeSystem) {
                this.setViewFromTimeSystem(timeSystem);
            }

            this.setViewFromClock(this.timeAPI.clock());

            var offsets = this.timeAPI.clockOffsets();
            if (offsets) {
                this.setViewFromOffsets(offsets);
            }

            var bounds = this.timeAPI.bounds();
            if (bounds && bounds.start !== undefined && bounds.end !== undefined) {
                this.setViewFromBounds(bounds);
            }

            this.$scope.$watch("tcController.menu.selected", this.selectMenuOption);

            this.conductorViewService.on('pan', this.onPan);
            this.conductorViewService.on('pan-stop', this.onPanStop);

            //Respond to any subsequent conductor changes
            this.timeAPI.on('bounds', this.setViewFromBounds);
            this.timeAPI.on('timeSystem', this.setViewFromTimeSystem);
            this.timeAPI.on('clock', this.setViewFromClock);
            this.timeAPI.on('clockOffsets', this.setViewFromOffsets);
            this.$scope.$on('$destroy', this.destroy);
        }


        TimeConductorController.prototype.getClock = function (key) {
            return this.timeAPI.getAllClocks().filter(function (clock) {
                return clock.key === key;
            })[0];
        };

        TimeConductorController.prototype.getTimeSystem = function (key) {
            return this.timeAPI.getAllTimeSystems().filter(function (timeSystem) {
                return timeSystem.key === key;
            })[0];
        };

        /**
         * @private
         * @param newOption
         * @param oldOption
         */
        TimeConductorController.prototype.selectMenuOption = function (newOption, oldOption){
            if (newOption !== oldOption) {
                var config = this.getConfig(this.timeAPI.timeSystem(), newOption.clock);
                if (config === undefined) {
                    //Default to first time system available if the current one is not compatible with the new clock
                    var timeSystem = this.timeSystemsForClocks[newOption.key][0];
                    this.$scope.timeSystemModel.selected = timeSystem;
                    this.setTimeSystemFromView(timeSystem.key);
                    config = this.getConfig(timeSystem, newOption.clock);
                }

                if (newOption.key === 'fixed') {
                    this.timeAPI.stopClock();
                } else {
                    this.timeAPI.clock(newOption.key, config.clockOffsets);
                }
            }
        };

        /**
         * @private
         * @param config
         * @returns {*[]}
         */
        TimeConductorController.prototype.optionsFromConfig = function (config) {
            var options = [{
                key: 'fixed',
                name: 'Fixed Timespan Mode',
                description: 'Query and explore data that falls between two fixed datetimes',
                cssClass: 'icon-calendar'
            }];
            var clocks = {};
            var clocksForTimeSystem = this.clocksForTimeSystem;
            var timeSystemsForClocks = this.timeSystemsForClocks;

            (config.menuOptions || []).forEach(function (menuOption) {
                var clock = this.getClock(menuOption.clock);
                var clockKey = menuOption.clock || 'fixed';

                var timeSystem = this.getTimeSystem(menuOption.timeSystem);
                if (timeSystem !== undefined) {
                    if (clock !== undefined) {
                        clocks[clock.key] = clock;
                        clocksForTimeSystem[timeSystem.key] = clocksForTimeSystem[timeSystem.key] || [];
                        clocksForTimeSystem[timeSystem.key].push(clock);
                    }
                    timeSystemsForClocks[clockKey] = timeSystemsForClocks[clockKey] || [];
                    timeSystemsForClocks[clockKey].push(timeSystem);
                } else if (menuOption.clock !== undefined) {
                    console.log('Unknown clock "' + clockKey + '", has it been registered?');
                }
            }.bind(this));

            Object.values(clocks).forEach(function (clock) {
                options.push({
                    key: clock.key,
                    name: clock.name,
                    description: "Monitor streaming data in real-time. The Time " +
                    "Conductor and displays will automatically advance themselves based on this clock. " + clock.description,
                    cssClass: clock.cssClass || 'icon-clock',
                    clock: clock
                });
            }.bind(this));

            return options;
        };

        /**
         * @private
         */
        TimeConductorController.prototype.destroy = function () {
            this.timeAPI.off('bounds', this.setViewFromBounds);
            this.timeAPI.off('timeSystem', this.setViewFromTimeSystem);
            this.timeAPI.off('clock', this.setViewFromClock);
            this.timeAPI.off('follow', this.setFollow);
            this.timeAPI.off('clockOffsets', this.setViewFromOffsets);

            this.conductorViewService.off('pan', this.onPan);
            this.conductorViewService.off('pan-stop', this.onPanStop);
        };

        /**
         * Called when the bounds change in the time conductor. Synchronizes
         * the bounds values in the time conductor with those in the form
         * @param {TimeConductorBounds}
         */
        TimeConductorController.prototype.setViewFromBounds = function (bounds) {
            if (!this.zooming && !this.panning) {
                this.$scope.boundsModel.start = bounds.start;
                this.$scope.boundsModel.end = bounds.end;

                if (this.supportsZoom()) {
                    var config = this.getConfig(this.timeAPI.timeSystem(), this.timeAPI.clock());
                    this.currentZoom = this.toSliderValue(bounds.end - bounds.start, config.zoomOutLimit, config.zoomInLimit);
                    this.toTimeUnits(bounds.end - bounds.start);
                }

                if (!this.pendingUpdate) {
                    this.pendingUpdate = true;
                    this.$window.requestAnimationFrame(function () {
                        this.pendingUpdate = false;
                        this.$scope.$digest();
                    }.bind(this));
                }
            }
        };

        /**
         * @private
         * @param timeSystem
         * @param clock
         * @returns {T}
         */
        TimeConductorController.prototype.getConfig = function (timeSystem, clock) {
            var clockKey = clock && clock.key;
            var timeSystemKey = timeSystem && timeSystem.key;

            var option = this.config.menuOptions.filter(function (menuOption) {
                return menuOption.timeSystem === timeSystemKey && menuOption.clock === clockKey;
            })[0];
            return option;
        };

        /**
         * When the offsets change, update the values in the UI
         * @private
         */
        TimeConductorController.prototype.setViewFromOffsets = function (offsets) {
            this.$scope.boundsModel.startOffset = Math.abs(offsets.start);
            this.$scope.boundsModel.endOffset = offsets.end;
        };

        /**
         * Called when form values are changed.
         * @param formModel
         */
        TimeConductorController.prototype.setBoundsFromView = function (boundsModel) {
            var bounds = this.timeAPI.bounds();
            if (boundsModel.start !== bounds.start || boundsModel.end !== bounds.end) {
                this.timeAPI.bounds({
                    start: boundsModel.start,
                    end: boundsModel.end
                });
            }
        };

        /**
         * Called when form values are changed.
         * @param formModel
         */
        TimeConductorController.prototype.setOffsetsFromView = function (boundsModel) {
            if (this.validation.validateStartOffset(boundsModel.startOffset) && this.validation.validateEndOffset(boundsModel.endOffset)) {
                var offsets = {
                    start: 0 - boundsModel.startOffset,
                    end: boundsModel.endOffset
                };
                var existingOffsets = this.timeAPI.clockOffsets();

                if (offsets.start !== existingOffsets.start || offsets.end !== existingOffsets.end) {
                    //Sychronize offsets between form and time API
                    this.timeAPI.clockOffsets(offsets);
                }
            }
        };

        /**
         * @private
         * @returns {boolean}
         */
        TimeConductorController.prototype.supportsZoom = function () {
            var config = this.getConfig(this.timeAPI.timeSystem(), this.timeAPI.clock());
            return config && (config.zoomInLimit !== undefined && config.zoomOutLimit !== undefined);
        };

        /**
         * Change the selected Time Conductor mode. This will call destroy
         * and initialization functions on the relevant modes, setting
         * default values for bound and offsets in the form.
         *
         * @private
         * @param newClockKey
         * @param oldModeKey
         */
        TimeConductorController.prototype.setViewFromClock = function (clock) {
            var newClockKey = clock && clock.key;
            var timeSystems = this.timeSystemsForClocks[newClockKey || 'fixed'];
            var menuOption = this.menu.options.filter(function (option) {
                return option.key === (newClockKey || 'fixed');
            })[0];

            this.menu.selected = menuOption;

            //Try to find currently selected time system in time systems for clock
            var selectedTimeSystem = timeSystems.filter(function (timeSystem){
                return timeSystem.key === this.$scope.timeSystemModel.selected.key;
            }.bind(this))[0];

            var config = this.getConfig(selectedTimeSystem, clock);

            if (selectedTimeSystem === undefined){
                selectedTimeSystem = timeSystems[0];
                config = this.getConfig(selectedTimeSystem, clock);

                if (clock === undefined) {
                    var bounds = config.bounds;
                    this.timeAPI.timeSystem(selectedTimeSystem, bounds);
                } else {
                    //When time system changes, some start bounds need to be provided
                    var bounds = {
                        start: clock.currentValue() + config.clockOffsets.start,
                        end: clock.currentValue() + config.clockOffsets.end
                    };
                    this.timeAPI.timeSystem(selectedTimeSystem, bounds);
                }
            }

            this.mode = clock === undefined ? 'fixed' : 'realtime';

            if (clock !== undefined) {
                this.setViewFromOffsets(this.timeAPI.clockOffsets());
            } else {
                this.setViewFromBounds(this.timeAPI.bounds());
            }

            this.zoom = this.supportsZoom();
            this.$scope.timeSystemModel.options = timeSystems;
        };

        /**
         * Respond to time system selection from UI
         *
         * Allows time system to be changed by key. This supports selection
         * from the menu. Resolves a TimeSystem object and then invokes
         * TimeConductorController#setTimeSystem
         * @param key
         * @see TimeConductorController#setTimeSystem
         */
        TimeConductorController.prototype.setTimeSystemFromView = function (key) {
            var clock = this.menu.selected.clock;
            var timeSystem = this.getTimeSystem(key);
            var config = this.getConfig(timeSystem, clock);
            var bounds;

            this.$scope.timeSystemModel.selected = timeSystem;

            /**
             * Time systems require default bounds to be specified when they
             * are set
             */
            if (clock === undefined) {
                bounds = config.bounds;
            } else {
                bounds = {
                    start: clock.currentValue() + config.clockOffsets.start,
                    end: clock.currentValue() + config.clockOffsets.end
                };
            }
            this.timeAPI.timeSystem(timeSystem, bounds);
        };

        /**
         * Handles time system change from time conductor
         *
         * Sets the selected time system. Will populate form with the default
         * bounds and offsets defined in the selected time system.
         *
         * @param newTimeSystem
         */
        TimeConductorController.prototype.setViewFromTimeSystem = function (timeSystem) {
            var oldKey = (this.$scope.timeSystemModel.selected || {}).key;
            var timeSystemModel = this.$scope.timeSystemModel;

            if (timeSystem && (timeSystem.key !== oldKey)) {
                var config = this.getConfig(timeSystem, this.timeAPI.clock());

                timeSystemModel.selected = timeSystem;
                timeSystemModel.format = timeSystem.timeFormat;
                timeSystemModel.durationFormat = timeSystem.durationFormat;

                if (this.supportsZoom()) {
                    timeSystemModel.minZoom = config.zoomOutLimit;
                    timeSystemModel.maxZoom = config.zoomInLimit;
                }
            }
            this.zoom = this.supportsZoom();
        };

        /**
         * Takes a time span and calculates a slider increment value, used
         * to set the horizontal offset of the slider.
         * @param {number} timeSpan a duration of time, in ms
         * @returns {number} a value between 0.01 and 0.99, in increments of .01
         */
        TimeConductorController.prototype.toSliderValue = function (timeSpan, zoomOutLimit, zoomInLimit) {
            var perc = timeSpan / (zoomOutLimit - zoomInLimit);
            return 1 - Math.pow(perc, 1 / 4);
        };

        /**
         * Given a time span, set a label for the units of time that it,
         * roughly, represents. Leverages
         * @param {TimeSpan} timeSpan
         */
        TimeConductorController.prototype.toTimeUnits = function (timeSpan) {
            var timeSystem = this.timeAPI.timeSystem();
            if (timeSystem && timeSystem.isUTCBased) {
                var momentified = moment.duration(timeSpan);

                this.$scope.timeUnits = timeUnitsMegastructure.filter(function (row) {
                    return row[1](momentified);
                })[0][0];
            }
        };

        /**
         * Zooming occurs when the user manipulates the zoom slider.
         * Zooming updates the scale and bounds fields immediately, but does
         * not trigger a bounds change to other views until the mouse button
         * is released.
         * @param bounds
         */
        TimeConductorController.prototype.onZoom = function (sliderValue) {
            var config = this.getConfig(this.timeAPI.timeSystem(), this.timeAPI.clock());
            var timeSpan = Math.pow((1 - sliderValue), 4) * (config.zoomOutLimit - config.zoomInLimit);

            var zoom = this.conductorViewService.zoom(timeSpan);

            this.$scope.boundsModel.start = zoom.bounds.start;
            this.$scope.boundsModel.end = zoom.bounds.end;
            this.toTimeUnits(zoom.bounds.end - zoom.bounds.start);

            if (zoom.offsets) {
                this.setViewFromOffsets(zoom.offsets);
            }
        };

        /**
         * Fired when user has released the zoom slider
         * @event platform.features.conductor.TimeConductorController~zoomStop
         */
        /**
         * Invoked when zoom slider is released by user. Will update the time conductor with the new bounds, triggering
         * a global bounds change event.
         * @fires platform.features.conductor.TimeConductorController~zoomStop
         */
        TimeConductorController.prototype.onZoomStop = function () {
            this.setBoundsFromView(this.$scope.boundsModel);
            this.setOffsetsFromView(this.$scope.boundsModel);
            this.zooming = false;

            this.conductorViewService.emit('zoom-stop');
        };

        /**
         * Panning occurs when the user grabs the conductor scale and drags
         * it left or right to slide the window of time represented by the
         * conductor. Panning updates the scale and bounds fields
         * immediately, but does not trigger a bounds change to other views
         * until the mouse button is released.
         * @param {TimeConductorBounds} bounds
         */
        TimeConductorController.prototype.onPan = function (bounds) {
            this.panning = true;
            this.$scope.boundsModel.start = bounds.start;
            this.$scope.boundsModel.end = bounds.end;
        };

        /**
         * Called when the user releases the mouse button after panning.
         */
        TimeConductorController.prototype.onPanStop = function () {
            this.panning = false;
        };

        return TimeConductorController;
    }
);
