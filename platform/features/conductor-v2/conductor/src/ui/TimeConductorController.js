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
        './TimeConductorValidation'
    ],
    function (TimeConductorValidation) {

        /**
         * Controller for the Time Conductor UI element. The Time Conductor includes form fields for specifying time
         * bounds and relative time deltas for queries, as well as controls for selection mode, time systems, and zooming.
         * @memberof platform.features.conductor
         * @constructor
         */
        function TimeConductorController($scope, $window, openmct, conductorViewService, timeSystems, formatService) {

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
            this.conductor = openmct.conductor;
            this.modes = conductorViewService.availableModes();
            this.validation = new TimeConductorValidation(this.conductor);
            this.formatService = formatService;

            // Construct the provided time system definitions
            this.timeSystems = timeSystems.map(function (timeSystemConstructor) {
                return timeSystemConstructor();
            });

            //Set the initial state of the view based on current time conductor
            this.initializeScope();

            this.conductor.on('bounds', this.changeBounds);
            this.conductor.on('timeSystem', this.changeTimeSystem);

            // If no mode selected, select fixed as the default
            if (!this.conductorViewService.mode()) {
                this.setMode('fixed');
            }
        }

        /**
         * @private
         */
        TimeConductorController.prototype.initializeScope = function () {
            //Set time Conductor bounds in the form
            this.$scope.boundsModel = this.conductor.bounds();

            //If conductor has a time system selected already, populate the
            //form from it
            this.$scope.timeSystemModel = {};
            var timeSystem = this.conductor.timeSystem();
            if (timeSystem) {
                this.setFormFromTimeSystem(timeSystem);
            }

            //Represents the various modes, and the currently selected mode
            //in the view
            this.$scope.modeModel = {
                options: this.conductorViewService.availableModes()
            };

            var mode = this.conductorViewService.mode();
            if (mode) {
                //If view already defines a mode (eg. controller is being
                // initialized after navigation), then pre-populate form.
                this.setFormFromMode(mode);
                var deltas = this.conductorViewService.deltas();
                if (deltas) {
                    this.setFormFromDeltas(deltas);
                }

            }

            this.setFormFromBounds(this.conductor.bounds());

            // Watch scope for selection of mode or time system by user
            this.$scope.$watch('modeModel.selectedKey', this.setMode);

            this.conductorViewService.on('pan', this.onPan);
            this.conductorViewService.on('pan-stop', this.onPanStop);

            this.$scope.$on('$destroy', this.destroy);
        };

        /**
         * @private
         */
        TimeConductorController.prototype.destroy = function () {
            this.conductor.off('bounds', this.changeBounds);
            this.conductor.off('timeSystem', this.changeTimeSystem);

            this.conductorViewService.off('pan', this.onPan);
            this.conductorViewService.off('pan-stop', this.onPanStop);
        };

        /**
         * When the conductor bounds change, set the bounds in the form.
         * @private
         * @param {TimeConductorBounds} bounds
         */
        TimeConductorController.prototype.changeBounds = function (bounds) {
            //If a zoom or pan is currently in progress, do not override form values.
            if (!this.zooming && !this.panning) {
                this.setFormFromBounds(bounds);
            }
        };

        /**
         * Does the currently selected time system support zooming? To
         * support zooming a time system must, at a minimum, define some
         * values for maximum and minimum zoom levels. Additionally
         * TimeFormats, a related concept, may also support providing time
         * unit feedback for the zoom level label, eg "seconds, minutes,
         * hours, etc..."
         * @returns {boolean}
         */
        TimeConductorController.prototype.supportsZoom = function () {
            var timeSystem = this.conductor.timeSystem();
            return timeSystem &&
                    timeSystem.defaults() &&
                    timeSystem.defaults().zoom;
        };

        /**
         * Called when the bounds change in the time conductor. Synchronizes
         * the bounds values in the time conductor with those in the form
         * @param {TimeConductorBounds}
         */
        TimeConductorController.prototype.setFormFromBounds = function (bounds) {
            if (!this.zooming && !this.panning) {
                this.$scope.boundsModel.start = bounds.start;
                this.$scope.boundsModel.end = bounds.end;

                if (this.supportsZoom()) {
                    this.currentZoom = this.toSliderValue(bounds.end - bounds.start);
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
         * On mode change, populate form based on time systems available
         * from the selected mode.
         * @param mode
         */
        TimeConductorController.prototype.setFormFromMode = function (mode) {
            this.$scope.modeModel.selectedKey = mode;
            //Synchronize scope with time system on mode
            this.$scope.timeSystemModel.options =
                this.conductorViewService.availableTimeSystems()
                .map(function (t) {
                    return t.metadata;
                });
        };

        /**
         * When the deltas change, update the values in the UI
         * @private
         */
        TimeConductorController.prototype.setFormFromDeltas = function (deltas) {
            this.$scope.boundsModel.startDelta = deltas.start;
            this.$scope.boundsModel.endDelta = deltas.end;
        };

        /**
         * Initialize the form when time system changes.
         * @param {TimeSystem} timeSystem
         */
        TimeConductorController.prototype.setFormFromTimeSystem = function (timeSystem) {
            var timeSystemModel = this.$scope.timeSystemModel;
            timeSystemModel.selected = timeSystem;
            timeSystemModel.format = timeSystem.formats()[0];
            timeSystemModel.deltaFormat = timeSystem.deltaFormat();

            if (this.supportsZoom()) {
                timeSystemModel.minZoom = timeSystem.defaults().zoom.min;
                timeSystemModel.maxZoom = timeSystem.defaults().zoom.max;
            }
        };

        /**
         * Called when form values are changed. Synchronizes the form with
         * the time conductor
         * @param formModel
         */
        TimeConductorController.prototype.updateBoundsFromForm = function (boundsModel) {
            this.conductor.bounds({
                start: boundsModel.start,
                end: boundsModel.end
            });
        };

        /**
         * Called when the delta values in the form change. Validates and
         * sets the new deltas on the Mode.
         * @param boundsModel
         * @see TimeConductorMode
         */
        TimeConductorController.prototype.updateDeltasFromForm = function (boundsFormModel) {
            var deltas = {
                start: boundsFormModel.startDelta,
                end: boundsFormModel.endDelta
            };
            if (this.validation.validateStartDelta(deltas.start) && this.validation.validateEndDelta(deltas.end)) {
                //Sychronize deltas between form and mode
                this.conductorViewService.deltas(deltas);
            }
        };

        /**
         * Change the selected Time Conductor mode. This will call destroy
         * and initialization functions on the relevant modes, setting
         * default values for bound and deltas in the form.
         *
         * @private
         * @param newModeKey
         * @param oldModeKey
         */
        TimeConductorController.prototype.setMode = function (newModeKey, oldModeKey) {
            if (newModeKey !== oldModeKey) {
                this.conductorViewService.mode(newModeKey);
                this.setFormFromMode(newModeKey);
            }
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
        TimeConductorController.prototype.selectTimeSystemByKey = function (key) {
            var selected = this.timeSystems.filter(function (timeSystem) {
                return timeSystem.metadata.key === key;
            })[0];
            this.conductor.timeSystem(selected, selected.defaults().bounds);
        };

        /**
         * Handles time system change from time conductor
         *
         * Sets the selected time system. Will populate form with the default
         * bounds and deltas defined in the selected time system.
         *
         * @param newTimeSystem
         */
        TimeConductorController.prototype.changeTimeSystem = function (newTimeSystem) {
            if (newTimeSystem && (newTimeSystem !== this.$scope.timeSystemModel.selected)) {
                this.setFormFromTimeSystem(newTimeSystem);
                if (newTimeSystem.defaults()) {
                    var deltas = newTimeSystem.defaults().deltas || {start: 0, end: 0};
                    var bounds = newTimeSystem.defaults().bounds || {start: 0, end: 0};

                    this.setFormFromDeltas(deltas);
                    this.setFormFromBounds(bounds);
                }
            }
        };

        /**
         * Takes a time span and calculates a slider increment value, used
         * to set the horizontal offset of the slider.
         * @param {number} timeSpan a duration of time, in ms
         * @returns {number} a value between 0.01 and 0.99, in increments of .01
         */
        TimeConductorController.prototype.toSliderValue = function (timeSpan) {
            var timeSystem = this.conductor.timeSystem();
            if (timeSystem) {
                var zoomDefaults = this.conductor.timeSystem().defaults().zoom;
                var perc = timeSpan / (zoomDefaults.min - zoomDefaults.max);
                return 1 - Math.pow(perc, 1 / 4);
            }
        };

        /**
         * Given a time span, set a label for the units of time that it,
         * roughly, represents. Leverages
         * @param {TimeSpan} timeSpan
         */
        TimeConductorController.prototype.toTimeUnits = function (timeSpan) {
            if (this.conductor.timeSystem()) {
                var timeFormat = this.formatService.getFormat(this.conductor.timeSystem().formats()[0]);
                this.$scope.timeUnits = timeFormat.timeUnits && timeFormat.timeUnits(timeSpan);
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
            var zoomDefaults = this.conductor.timeSystem().defaults().zoom;
            var timeSpan = Math.pow((1 - sliderValue), 4) * (zoomDefaults.min - zoomDefaults.max);

            var zoom = this.conductorViewService.zoom(timeSpan);

            this.$scope.boundsModel.start = zoom.bounds.start;
            this.$scope.boundsModel.end = zoom.bounds.end;
            this.toTimeUnits(zoom.bounds.end - zoom.bounds.start);

            if (zoom.deltas) {
                this.setFormFromDeltas(zoom.deltas);
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
            this.updateBoundsFromForm(this.$scope.boundsModel);
            this.updateDeltasFromForm(this.$scope.boundsModel);
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
