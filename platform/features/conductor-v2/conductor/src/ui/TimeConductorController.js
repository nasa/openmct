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
        './modes/FixedMode',
        './modes/FollowMode',
        './TimeConductorValidation'
    ],
    function (FixedMode, FollowMode, TimeConductorValidation) {

        function TimeConductorController($scope, conductor, timeSystems) {

            var self = this;

            //Bind all class functions to 'this'
            Object.keys(TimeConductorController.prototype).filter(function (key) {
                return typeof TimeConductorController.prototype[key] === 'function';
            }).forEach(function (key) {
                self[key] = self[key].bind(self);
            });

            this.conductor = conductor;
            // Construct the provided time system definitions
            this._timeSystems = timeSystems.map(function (timeSystemConstructor){
                return timeSystemConstructor();
            });

            this.modes = {
                'fixed': {
                    glyph: '\ue604',
                    label: 'Fixed',
                    name: 'Fixed Timespan Mode',
                    description: 'Query and explore data that falls between two fixed datetimes.'
                }
            };

            //Only show 'real-time mode' if a clock source is available
            if (this.timeSystemsForSourceType('clock').length > 0 ) {
                this.modes['realtime'] = {
                    glyph: '\u0043',
                    label: 'Real-time',
                    name: 'Real-time Mode',
                    description: 'Monitor real-time streaming data as it comes in. The Time Conductor and displays will automatically advance themselves based on a UTC clock.'
                }
            }

            //Only show 'real-time mode' if a clock source is available
            if (this.timeSystemsForSourceType('data').length > 0) {
                this.modes['latest'] = {
                    glyph: '\u0044',
                        label: 'LAD',
                        name: 'LAD Mode',
                        description: 'Latest Available Data mode monitors real-time streaming data as it comes in. The Time Conductor and displays will only advance when data becomes available.'
                }
            }

            this.selectedMode = undefined;

            this.validation = new TimeConductorValidation(conductor);
            this.$scope = $scope;
            this.initializeScope($scope);

            conductor.on('bounds', this.setBounds);
            conductor.on('follow', function (follow){
                $scope.followMode = follow;
            });

            //Set the time conductor mode to the first one in the list,
            // effectively initializing the time conductor
            this.setMode('fixed');
        }

        /**
         * @private
         */
        TimeConductorController.prototype.initializeScope = function ($scope) {
            var self = this;
            /*
            Represents the various time system options, and the currently
            selected time system in the view. Additionally holds the
            default format from the selected time system for convenience
            of access from the template.
             */
            $scope.timeSystemModel = {
                selected: undefined,
                format: undefined,
                options: []
            };
            /*
             Represents the various modes, and the currently
             selected mode in the view
             */
            $scope.modeModel = {
                selectedKey: undefined,
                options: this.modes
            };
            /*
            Time Conductor bounds in the form
             */
            $scope.formModel = {
                start: 0,
                end: 0
            };

            $scope.$watch('modeModel.selectedKey', this.setMode);
            $scope.$watch('timeSystem', this.setTimeSystem);

            $scope.$on('$destroy', function() {
                if (self.selectedMode) {
                    self.selectedMode.destroy();
                }
            });
        };

        /**
         * Called when the bounds change in the time conductor. Synchronizes
         * the bounds values in the time conductor with those in the form
         * @param bounds
         */
        TimeConductorController.prototype.setBounds = function (bounds) {
            this.$scope.formModel.start = bounds.start;
            this.$scope.formModel.end = bounds.end;
        };

        /**
         * Called when form values are changed. Synchronizes the form with
         * the time conductor
         * @param formModel
         */
        TimeConductorController.prototype.updateBoundsFromForm = function (formModel) {
            var newBounds = {
                start: formModel.start,
                end: formModel.end
            };

            if (this.conductor.validateBounds(newBounds) === true) {
                this.conductor.bounds(newBounds);
            }
        };

        /**
         * Called when the delta values in the form change. Validates and
         * sets the new deltas on the Mode.
         * @param formModel
         * @see TimeConductorMode
         */
        TimeConductorController.prototype.updateDeltasFromForm = function (formModel) {
            var mode = this.selectedMode,
                deltas = mode.deltas();

            if (deltas !== undefined && this.validation.validateDeltas(formModel)) {
                //Sychronize deltas between form and mode
                mode.deltas({start: formModel.startDelta, end: formModel.endDelta});
            }
        };

        /**
         * @private
         */
        TimeConductorController.prototype.timeSystemsForSourceType = function(type){
            if (!type) {
                return this._timeSystems;
            } else {
                return this._timeSystems.filter(function (timeSystem){
                    return timeSystem.tickSources().some(function (tickSource){
                        return tickSource.type() === type;
                    });
                });
            }
        };
        
        /**
         * Change the selected Time Conductor mode. This will call destroy
         * and initialization functions on the relevant modes, setting
         * default values for bound and deltas in the form.
         * @param newMode
         * @param oldMode
         */
        TimeConductorController.prototype.setMode = function (newMode, oldMode) {
            if (newMode !== oldMode) {
                this.$scope.modeModel.selectedKey = newMode;

                if (this.selectedMode) {
                    this.selectedMode.destroy();
                }
                switch (newMode) {
                    case 'fixed':
                        this.selectedMode = new FixedMode(this.conductor, this._timeSystems);
                        break;
                    case 'realtime':
                        // Filter time systems to only those with clock tick
                        // sources
                        this.selectedMode = new FollowMode(this.conductor, this.timeSystemsForSourceType('clock'));
                        break;
                    case 'latest':
                        // Filter time systems to only those with data tick
                        // sources
                        this.selectedMode = new FollowMode(this.conductor, this.timeSystemsForSourceType('data'));
                        break;
                }
                this.selectedMode.initialize();

                var timeSystem = this.selectedMode.selectedTimeSystem();

                //Synchronize scope with time system on mode
                this.$scope.timeSystemModel.options = this.selectedMode.timeSystems().map(function (timeSystem) {
                    return timeSystem.metadata;
                });

                this.setTimeSystem(timeSystem);
            }
        };

        /**
         * @private
         */
        TimeConductorController.prototype.setDeltasFromTimeSystem = function (timeSystem) {
            var defaults = timeSystem.defaults()[0];
            var deltas = defaults.deltas;

            /*
             * If the selected mode defines deltas, set them in the form
             */
            if (deltas !== undefined) {
                this.$scope.formModel.startDelta = deltas.start;
                this.$scope.formModel.endDelta = deltas.end;
            } else {
                this.$scope.formModel.startDelta = 0;
                this.$scope.formModel.endDelta = 0;
            }
        };

        /**
         * Allows time system to be changed by key. This supports selection
         * from the menu. Resolves a TimeSystem object and then invokes
         * TimeConductorController#setTimeSystem
         * @param key
         * @see TimeConductorController#setTimeSystem
         */
        TimeConductorController.prototype.selectTimeSystem = function(key){
            var selected = this._timeSystems.find(function (timeSystem){
                return timeSystem.metadata.key === key;
            });
            this.setTimeSystem(selected);
        };

        /**
         * Sets the selected time system. Will populate form with the default
         * bounds and deltas defined in the selected time system.
         * @param newTimeSystem
         */
        TimeConductorController.prototype.setTimeSystem = function (newTimeSystem) {
            if (newTimeSystem && newTimeSystem !== this.$scope.timeSystemModel.selected) {
                this.$scope.timeSystemModel.selected = newTimeSystem;
                this.$scope.timeSystemModel.format = newTimeSystem.formats()[0];
                var mode = this.selectedMode;
                mode.selectedTimeSystem(newTimeSystem);
                this.setDeltasFromTimeSystem(newTimeSystem);
            }
        };

        return TimeConductorController;
    }
);
