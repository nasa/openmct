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
        './TimeConductorValidation',
        './TimeConductorViewService'
    ],
    function (
        moment,
        TimeConductorValidation,
        TimeConductorViewService
    ) {

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
         * Controller for the Time Conductor UI element. The Time Conductor
         * includes form fields for specifying time bounds and relative time
         * offsets for queries, as well as controls for selection mode,
         * time systems, and zooming.
         * @memberof platform.features.conductor
         * @constructor
         */
        function TimeConductorController(
            $scope,
            $window,
            openmct,
            formatService,
            config
        ) {

            //Bind functions that are used as callbacks to 'this'.
            [
                "selectMenuOption",
                "onPan",
                "onPanStop",
                "setViewFromBounds",
                "setViewFromClock",
                "setViewFromOffsets",
                "setViewFromTimeSystem",
                "setTimeSystemFromView",
                "destroy"
            ].forEach(function (name) {
                this[name] = this[name].bind(this);
            }.bind(this));

            this.$scope = $scope;
            this.$window = $window;
            this.timeAPI = openmct.time;
            this.conductorViewService = new TimeConductorViewService(openmct);
            this.validation = new TimeConductorValidation(this.timeAPI);
            this.formatService = formatService;
            this.config = config;
            this.timeSystemsForClocks = {};
            this.$scope.timeSystemModel = {};
            this.$scope.boundsModel = {};

            this.timeSystems = this.timeAPI.getAllTimeSystems().reduce(function (map, timeSystem) {
                map[timeSystem.key] = timeSystem;
                return map;
            }, {});

            this.isFixed = this.timeAPI.clock() === undefined;

            var options = this.optionsFromConfig(config);
            this.menu = {
                selected: undefined,
                options: options,
                select: this.selectMenuOption
            };

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

            this.conductorViewService.on('pan', this.onPan);
            this.conductorViewService.on('pan-stop', this.onPanStop);

            //Respond to any subsequent conductor changes
            this.timeAPI.on('bounds', this.setViewFromBounds);
            this.timeAPI.on('timeSystem', this.setViewFromTimeSystem);
            this.timeAPI.on('clock', this.setViewFromClock);
            this.timeAPI.on('clockOffsets', this.setViewFromOffsets);
            this.$scope.$on('$destroy', this.destroy);
        }

        /**
         * Given a key for a clock, retrieve the clock object.
         * @private
         * @param key
         * @returns {Clock}
         */
        TimeConductorController.prototype.getClock = function (key) {
            return this.timeAPI.getAllClocks().filter(function (clock) {
                return clock.key === key;
            })[0];
        };

        /**
         * Activate the selected menu option. Menu options correspond to clocks.
         * A distinction is made to avoid confusion between the menu options and
         * their metadata, and actual {@link Clock} objects.
         *
         * @private
         * @param newOption
         */
        TimeConductorController.prototype.selectMenuOption = function (newOption) {
            if (this.menu.selected.key === newOption.key) {
                return;
            }
            this.menu.selected = newOption;

            var config = this.getConfig(this.timeAPI.timeSystem(), newOption.clock);
            if (!config) {
                // Clock does not support this timeSystem, fallback to first
                // option provided for clock.
                config = this.config.menuOptions.filter(function (menuOption) {
                    return menuOption.clock === (newOption.clock && newOption.clock.key);
                })[0];
            }

            if (config.clock) {
                this.timeAPI.clock(config.clock, config.clockOffsets);
                this.timeAPI.timeSystem(config.timeSystem);
            } else {
                this.timeAPI.stopClock();
                this.timeAPI.timeSystem(config.timeSystem, config.bounds);
            }
        };

        /**
         * From the provided configuration, build the available menu options.
         * @private
         * @param config
         * @returns {*[]}
         */
        TimeConductorController.prototype.optionsFromConfig = function (config) {
            /*
             * "Fixed Mode" is always the first available option.
             */
            var options = [{
                key: 'fixed',
                name: 'Fixed Timespan Mode',
                description: 'Query and explore data that falls between two fixed datetimes.',
                cssClass: 'icon-calendar'
            }];
            var clocks = {};
            var timeSystemsForClocks = this.timeSystemsForClocks;

            (config.menuOptions || []).forEach(function (menuOption) {
                var clockKey = menuOption.clock || 'fixed';
                var clock = this.getClock(clockKey);

                if (clock !== undefined) {
                    clocks[clock.key] = clock;
                }

                var timeSystem = this.timeSystems[menuOption.timeSystem];
                if (timeSystem !== undefined) {
                    timeSystemsForClocks[clockKey] = timeSystemsForClocks[clockKey] || [];
                    timeSystemsForClocks[clockKey].push(timeSystem);
                }
            }, this);

            /*
             * Populate the clocks menu with metadata from the available clocks
             */
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
         * When bounds change, set UI values from the new bounds.
         * @param {TimeBounds} bounds the bounds
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

                /*
                    Ensure that a digest occurs, capped at the browser's refresh
                    rate.
                 */
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
         * Retrieve any configuration defined for the provided time system and
         * clock
         * @private
         * @param timeSystem
         * @param clock
         * @returns {object} The Time Conductor configuration corresponding to
         * the provided combination of time system and clock
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
         * When the clock offsets change, update the values in the UI
         * @param {ClockOffsets} offsets
         * @private
         */
        TimeConductorController.prototype.setViewFromOffsets = function (offsets) {
            this.$scope.boundsModel.startOffset = Math.abs(offsets.start);
            this.$scope.boundsModel.endOffset = offsets.end;
        };

        /**
         * When form values for bounds change, update the bounds in the Time API
         * to trigger an application-wide bounds change.
         * @param {object} boundsModel
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
         * When form values for bounds change, update the bounds in the Time API
         * to trigger an application-wide bounds change.
         * @param {object} formModel
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
         * Update the UI state to reflect a change in clock. Provided conductor
         * configuration will be checked for compatibility between the new clock
         * and the currently selected time system. If configuration is not available,
         * an attempt will be made to default to a time system that is compatible
         * with the new clock
         *
         * @private
         * @param {Clock} clock
         */
        TimeConductorController.prototype.setViewFromClock = function (clock) {
            var newClockKey = clock ? clock.key : 'fixed';
            var timeSystems = this.timeSystemsForClocks[newClockKey];
            var menuOption = this.menu.options.filter(function (option) {
                return option.key === (newClockKey);
            })[0];

            this.menu.selected = menuOption;

            //Try to find currently selected time system in time systems for clock
            var selectedTimeSystem = timeSystems.filter(function (timeSystem) {
                return timeSystem.key === this.$scope.timeSystemModel.selected.key;
            }.bind(this))[0];

            var config = this.getConfig(selectedTimeSystem, clock);

            if (selectedTimeSystem === undefined) {
                selectedTimeSystem = timeSystems[0];
                config = this.getConfig(selectedTimeSystem, clock);

                if (clock === undefined) {
                    this.timeAPI.timeSystem(selectedTimeSystem, config.bounds);
                } else {
                    //When time system changes, some start bounds need to be provided
                    this.timeAPI.timeSystem(selectedTimeSystem, {
                        start: clock.currentValue() + config.clockOffsets.start,
                        end: clock.currentValue() + config.clockOffsets.end
                    });
                }
            }

            this.isFixed = clock === undefined;

            if (clock === undefined) {
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
            var timeSystem = this.timeSystems[key];
            var config = this.getConfig(timeSystem, clock);

            this.$scope.timeSystemModel.selected = timeSystem;
            this.$scope.timeSystemModel.format = timeSystem.timeFormat;

            if (clock === undefined) {
                this.timeAPI.timeSystem(timeSystem, config.bounds);
            } else {
                this.timeAPI.clock(clock, config.clockOffsets);
                this.timeAPI.timeSystem(timeSystem);
            }
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
         * @private
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
            this.zooming = true;

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
            if (this.timeAPI.clock() !== undefined) {
                this.setOffsetsFromView(this.$scope.boundsModel);
            }
            this.setBoundsFromView(this.$scope.boundsModel);

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

        return TimeConductorController;
    }
);
