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
        './modes/RealtimeMode',
        './modes/LADMode',
        './TimeConductorValidation'
    ],
    function (FixedMode, RealtimeMode, LADMode, TimeConductorValidation) {

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
            this.timeSystems = timeSystems.map(function (timeSystemConstructor){
                return timeSystemConstructor();
            });
            // Populate a list of modes supported by the time conductor
            this.modes = [
                new FixedMode(this.conductor, this.timeSystems),
                new RealtimeMode(this.conductor, this.timeSystems),
                new LADMode(this.conductor, this.timeSystems)
            ];

            this.validation = new TimeConductorValidation(conductor);
            this.$scope = $scope;
            this.initializeScope($scope);

            conductor.on('bounds', this.setBounds);
            conductor.on('follow', function (follow){
                $scope.followMode = follow;
            });

            //Set the time conductor mode to the first one in the list,
            // effectively initializing the time conductor
            this.setMode(this.modes[0]);
        }

        /**
         * @private
         */
        TimeConductorController.prototype.initializeScope = function ($scope) {
            $scope.timeSystemModel = {
                selected: undefined,
                format: undefined,
                options: []
            };
            $scope.modeModel = {
                selected: undefined,
                options: this.modes
            };
            $scope.formModel = {
                start: 0,
                end: 0
            };
            $scope.changing = {
                'start': false,
                'end': false
            };

            $scope.$watch('modeModel.selected', this.setMode);
            $scope.$watch('timeSystem', this.setTimeSystem);

            $scope.$on('$destroy', function() {
                var mode = $scope.modeModel.selected;
                if (mode && mode.destroy) {
                    mode.destroy();
                }
            });
        };

        /**
         * Called when the bounds change in the time conductor. Synchronizes
         * the bounds values in the time conductor with those in the form
         * @param bounds
         */
        TimeConductorController.prototype.setBounds = function (bounds) {
            if (!this.$scope.changing['start']) {
                this.$scope.formModel.start = bounds.start;
            }
            if (!this.$scope.changing['end']) {
                this.$scope.formModel.end = bounds.end;
            }
        };

        /**
         * Called when form values are changed. Synchronizes the form with
         * the time conductor
         * @param formModel
         */
        TimeConductorController.prototype.updateBoundsFromForm = function (formModel) {
            var newBounds = {start: formModel.start, end: formModel.end};

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
            var mode = this.$scope.modeModel.selected,
                deltas = mode.deltas();

            if (deltas !== undefined && this.validation.validateDeltas(formModel)) {
                //Sychronize deltas between form and mode
                mode.deltas({start: formModel.startDelta, end: formModel.endDelta});
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
                if (oldMode && oldMode.destroy) {
                    oldMode.destroy();
                }
                newMode.initialize();

                var timeSystem = newMode.selectedTimeSystem();

                this.$scope.modeModel.selected = newMode;

                //Synchronize scope with time system on mode
                this.$scope.timeSystemModel.options = newMode.timeSystems().map(function (timeSystem) {
                    return timeSystem.metadata;
                });
                this.$scope.timeSystemModel.selected = timeSystem;
                //Use default format
                this.$scope.timeSystemModel.format = timeSystem.formats()[0];
                this.setDefaultsFromTimeSystem(newMode.selectedTimeSystem());
            }
        };

        /**
         * @private
         */
        TimeConductorController.prototype.setDefaultsFromTimeSystem = function (timeSystem) {
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
            var selected = this.timeSystems.find(function (timeSystem){
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
                var mode = this.$scope.modeModel.selected;
                mode.selectedTimeSystem(newTimeSystem);
                this.setDefaultsFromTimeSystem(newTimeSystem);
            }
        };

        return TimeConductorController;
    }
);
