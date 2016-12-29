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
    (TimeConductorValidation) => {
        const SEARCH = {
            MODE: 'tc.mode',
            TIME_SYSTEM: 'tc.timeSystem',
            START_BOUND: 'tc.startBound',
            END_BOUND: 'tc.endBound',
            START_DELTA: 'tc.startDelta',
            END_DELTA: 'tc.endDelta'
        };

        /**
         * Controller for the Time Conductor UI element. The Time Conductor includes form fields for specifying time
         * bounds and relative time deltas for queries, as well as controls for selection mode, time systems, and zooming.
         * @memberof platform.features.conductor
         * @constructor
         */
        class TimeConductorController {
          constructor(
            $scope, 
            $window, 
            $location, 
            openmct, 
            conductorViewService, 
            timeSystems, 
            formatService) {

            //Bind all class functions to 'this'
            Object.keys(TimeConductorController.prototype).filter( (key) => {
                return typeof TimeConductorController.prototype[key] === 'function';
            }).forEach( (key) => {
                self[key] = self[key].bind(this);
            });

            this.$scope = $scope;
            this.$window = $window;
            this.$location = $location;
            this.conductorViewService = conductorViewService;
            this.conductor = openmct.conductor;
            this.modes = conductorViewService.availableModes();
            this.validation = new TimeConductorValidation(this.conductor);
            this.formatService = formatService;

            // Construct the provided time system definitions
            this.timeSystems = timeSystems.map( (timeSystemConstructor) => {
                return timeSystemConstructor();
            });

            this.initializeScope();
            let searchParams = JSON.parse(JSON.stringify(this.$location.search()));
            //Set bounds, time systems, deltas, on conductor from URL
            this.setStateFromSearchParams(searchParams);

            //Set the initial state of the UI from the conductor state
            let timeSystem = this.conductor.timeSystem();
            if (timeSystem) {
                this.changeTimeSystem(this.conductor.timeSystem());
            }

            let deltas = this.conductorViewService.deltas();
            if (deltas) {
                this.setFormFromDeltas(deltas);
            }

            let bounds = this.conductor.bounds();
            if (bounds && bounds.start !== undefined && bounds.end !== undefined) {
                this.changeBounds(bounds);
            }

            //Listen for changes to URL and update state if necessary
            this.$scope.$on('$routeUpdate', () => {
                this.setStateFromSearchParams(this.$location.search());
            });

            //Respond to any subsequent conductor changes
            this.conductor.on('bounds', this.changeBounds);
            this.conductor.on('timeSystem', this.changeTimeSystem);
        }

        /**
         * Used as a url search param setter in place of $location.search(...)
         *
         * Invokes $location.search(...) but prevents an Angular route
         * change from occurring as a consequence which will cause
         * controllers to reload and strangeness to ensue.
         *
         * @private
         */
        setParam(name, value) {
            this.$location.search(name, value);
        };

        /**
         * @private
         */
        initializeScope() {
            //Set time Conductor bounds in the form
            this.$scope.boundsModel = this.conductor.bounds();

            //If conductor has a time system selected already, populate the
            //form from it
            this.$scope.timeSystemModel = {};

            //Represents the various modes, and the currently selected mode
            //in the view
            this.$scope.modeModel = {
                options: this.conductorViewService.availableModes()
            };

            // Watch scope for selection of mode or time system by user
            this.$scope.$watch('modeModel.selectedKey', this.setMode);

            this.conductorViewService.on('pan', this.onPan);
            this.conductorViewService.on('pan-stop', this.onPanStop);

            this.$scope.$on('$destroy', this.destroy);
        };

        setStateFromSearchParams(searchParams) {
            //Set mode from url if changed
            if (searchParams[SEARCH.MODE] === undefined ||
                searchParams[SEARCH.MODE] !== this.$scope.modeModel.selectedKey) {
                this.setMode(searchParams[SEARCH.MODE] || "fixed");
            }

            if (searchParams[SEARCH.TIME_SYSTEM] &&
                searchParams[SEARCH.TIME_SYSTEM] !== this.conductor.timeSystem().metadata.key) {
                //Will select the specified time system on the conductor
                this.selectTimeSystemByKey(searchParams[SEARCH.TIME_SYSTEM]);
            }

            let validDeltas = searchParams[SEARCH.MODE] !== 'fixed' &&
                searchParams[SEARCH.START_DELTA] &&
                searchParams[SEARCH.END_DELTA] &&
                !isNaN(searchParams[SEARCH.START_DELTA]) &&
                !isNaN(searchParams[SEARCH.END_DELTA]);

            if (validDeltas) {
                //Sets deltas from some form model
                this.setDeltas({
                    startDelta: parseInt(searchParams[SEARCH.START_DELTA]),
                    endDelta: parseInt(searchParams[SEARCH.END_DELTA])
                });
            }

            let validBounds = searchParams[SEARCH.MODE] === 'fixed' &&
                searchParams[SEARCH.START_BOUND] &&
                searchParams[SEARCH.END_BOUND] &&
                !isNaN(searchParams[SEARCH.START_BOUND]) &&
                !isNaN(searchParams[SEARCH.END_BOUND]);

            if (validBounds) {
                this.conductor.bounds({
                    start: parseInt(searchParams[SEARCH.START_BOUND]),
                    end: parseInt(searchParams[SEARCH.END_BOUND])
                });
            }
        };

        /**
         * @private
         */
        destroy() {
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
        changeBounds(bounds) {
            //If a zoom or pan is currently in progress, do not override form values.
            if (!this.zooming && !this.panning) {
                this.setFormFromBounds(bounds);
                if (this.conductorViewService.mode() === 'fixed') {
                    //Set bounds in URL on change
                    this.setParam(SEARCH.START_BOUND, bounds.start);
                    this.setParam(SEARCH.END_BOUND, bounds.end);
                }
            }
        };

        /**
         * Called when the bounds change in the time conductor. Synchronizes
         * the bounds values in the time conductor with those in the form
         * @param {TimeConductorBounds}
         */
        setFormFromBounds(bounds) {
            if (!this.zooming && !this.panning) {
                this.$scope.boundsModel.start = bounds.start;
                this.$scope.boundsModel.end = bounds.end;

                if (this.supportsZoom) {
                    this.currentZoom = this.toSliderValue(bounds.end - bounds.start);
                    this.toTimeUnits(bounds.end - bounds.start);
                }

                if (!this.pendingUpdate) {
                    this.pendingUpdate = true;
                    this.$window.requestAnimationFrame( () => {
                        this.pendingUpdate = false;
                        this.$scope.$digest();
                    });
                }
            }
        };

        /**
         * On mode change, populate form based on time systems available
         * from the selected mode.
         * @param mode
         */
        setFormFromMode(mode) {
            this.$scope.modeModel.selectedKey = mode;
            //Synchronize scope with time system on mode
            this.$scope.timeSystemModel.options =
                this.conductorViewService.availableTimeSystems()
                .map( (t) => {
                    return t.metadata;
                });
        };

        /**
         * When the deltas change, update the values in the UI
         * @private
         */
        setFormFromDeltas(deltas) {
            this.$scope.boundsModel.startDelta = deltas.start;
            this.$scope.boundsModel.endDelta = deltas.end;
        };

        /**
         * Initialize the form when time system changes.
         * @param {TimeSystem} timeSystem
         */
        setFormFromTimeSystem(timeSystem) {
            let timeSystemModel = this.$scope.timeSystemModel;
            timeSystemModel.selected = timeSystem;
            timeSystemModel.format = timeSystem.formats()[0];
            timeSystemModel.deltaFormat = timeSystem.deltaFormat();

            if (this.supportsZoom) {
                timeSystemModel.minZoom = timeSystem.defaults().zoom.min;
                timeSystemModel.maxZoom = timeSystem.defaults().zoom.max;
            }
        };

        /**
         * Called when form values are changed.
         * @param formModel
         */
        setBounds(boundsModel) {
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
        setDeltas(boundsFormModel) {
            let deltas = {
                start: boundsFormModel.startDelta,
                end: boundsFormModel.endDelta
            };
            if (this.validation.validateStartDelta(deltas.start) && this.validation.validateEndDelta(deltas.end)) {
                //Sychronize deltas between form and mode
                this.conductorViewService.deltas(deltas);

                //Set Deltas in URL on change
                this.setParam(SEARCH.START_DELTA, deltas.start);
                this.setParam(SEARCH.END_DELTA, deltas.end);
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
        setMode(newModeKey, oldModeKey) {
            //Set mode in URL on change
            this.setParam(SEARCH.MODE, newModeKey);

            if (newModeKey !== oldModeKey) {
                this.conductorViewService.mode(newModeKey);
                this.setFormFromMode(newModeKey);

                if (newModeKey === "fixed") {
                    this.setParam(SEARCH.START_DELTA, undefined);
                    this.setParam(SEARCH.END_DELTA, undefined);
                } else {
                    this.setParam(SEARCH.START_BOUND, undefined);
                    this.setParam(SEARCH.END_BOUND, undefined);

                    var deltas = this.conductorViewService.deltas();
                    if (deltas) {
                        this.setParam(SEARCH.START_DELTA, deltas.start);
                        this.setParam(SEARCH.END_DELTA, deltas.end);
                    }
                }
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
        selectTimeSystemByKey(key) {
            let selected = this.timeSystems.filter( (timeSystem) => {
                return timeSystem.metadata.key === key;
            })[0];
            if (selected) {
                this.supportsZoom = !!(selected.defaults() && selected.defaults().zoom);
                this.conductor.timeSystem(selected, selected.defaults().bounds);
            }
        };

        /**
         * Handles time system change from time conductor
         *
         * Sets the selected time system. Will populate form with the default
         * bounds and deltas defined in the selected time system.
         *
         * @param newTimeSystem
         */
        changeTimeSystem(newTimeSystem) {
            //Set time system in URL on change
            this.setParam(SEARCH.TIME_SYSTEM, newTimeSystem.metadata.key);

            if (newTimeSystem && (newTimeSystem !== this.$scope.timeSystemModel.selected)) {
                this.supportsZoom = !!(newTimeSystem.defaults() && newTimeSystem.defaults().zoom);
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
        toSliderValue(timeSpan) {
            let timeSystem = this.conductor.timeSystem();
            if (timeSystem) {
                let zoomDefaults = this.conductor.timeSystem().defaults().zoom;
                let perc = timeSpan / (zoomDefaults.min - zoomDefaults.max);
                return 1 - Math.pow(perc, 1 / 4);
            }
        };

        /**
         * Given a time span, set a label for the units of time that it,
         * roughly, represents. Leverages
         * @param {TimeSpan} timeSpan
         */
        toTimeUnits(timeSpan) {
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
        onZoom(sliderValue) {
            let zoomDefaults = this.conductor.timeSystem().defaults().zoom;
            let timeSpan = Math.pow((1 - sliderValue), 4) * (zoomDefaults.min - zoomDefaults.max);

            let zoom = this.conductorViewService.zoom(timeSpan);

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
        onZoomStop() {
            this.setBounds(this.$scope.boundsModel);
            this.setDeltas(this.$scope.boundsModel);
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
        onPan(bounds) {
            this.panning = true;
            this.$scope.boundsModel.start = bounds.start;
            this.$scope.boundsModel.end = bounds.end;
        };

        /**
         * Called when the user releases the mouse button after panning.
         */
        onPanStop() {
            this.panning = false;
        };
      }
        return TimeConductorController;
    }
);
