/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2018, United States Government
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
<template>
<!-- Parent holder for time conductor. follow-mode | fixed-mode -->
<div class="l-flex-row l-time-conductor"
    :class="[isFixed ? 'fixed-mode' : 'realtime-mode', panning ? 'status-panning' : '']">
    <div class="flex-elem holder time-conductor-icon">
        <div class="hand-little"></div>
        <div class="hand-big"></div>
    </div>

    <div class="flex-elem holder grows l-flex-col l-time-conductor-inner">
        <!-- Holds inputs and ticks -->
        <div class="l-time-conductor-inputs-and-ticks l-row-elem flex-elem no-margin">
            <form class="l-time-conductor-inputs-holder" ref="conductorForm"
                  @submit="isFixed ? setBoundsFromView($event) : setOffsetsFromView($event)">
                <span class="l-time-range-w start-w">
                    <span class="l-time-conductor-inputs">
                        <span class="l-time-range-input-w start-date">
                            <span class="title"></span>
                            <span class="time-range-input">
                                <input type="text" autocorrect="off" spellcheck="false"
                                    ref="startDate"
                                    v-model="formattedBounds.start"
                                    @keyup="validateBounds('start', $event.target)"
                                    @blur="setBoundsFromView()">
                                <date-picker :default-date-time="formattedBounds.start" :formatter="timeFormatter" @date-selected="startDateSelected"></date-picker>
                            </span>
                        </span>
                        <span class="l-time-range-input-w time-delta start-delta"
                            :class="{'hide': isFixed}">
                            - 
                            <span class="s-input-inline hrs-min-input">
                                <input type="text" autocorrect="off" spellcheck="false"
                                    v-model="offsets.start"
                                    @keyup="validateOffsets($event)"
                                    @blur="setOffsetsFromView()">
                            </span>
                        </span>
                    </span>
                </span>
                <span class="l-time-range-w end-w">
                    <span class="l-time-conductor-inputs">
                        <span class="l-time-range-input-w end-date">
                            <span class="title"></span>
                            <span class="time-range-input">
                                <input type="text" autocorrect="off" spellcheck="false"
                                    v-model="formattedBounds.end"
                                    :disabled="!isFixed"
                                    ref="endDate"
                                    @keyup="validateBounds('end', $event.target)"
                                    @blur="setBoundsFromView()">
                                <date-picker :default-date-time="formattedBounds.end" :formatter="timeFormatter" @date-selected="endDateSelected"></date-picker>
                            </span>
                        </span>
                        <span class="l-time-range-input-w time-delta end-delta"
                              :class="{'hide': isFixed}">
                                +
                            <span class="s-input-inline hrs-min-input">
                                <input type="text" autocorrect="off" spellcheck="false"
                                    v-model="offsets.end"
                                    @keyup="validateOffsets($event)"
                                    @blur="setOffsetsFromView()">
                            </span>
                        </span>
                    </span>
                </span>
                <input type="submit" class="invisible">
            </form>
            <conductor-axis class="mobile-hide" :bounds="rawBounds" @panZoom="setViewFromBounds"></conductor-axis>
        </div>

        <!-- Holds time system and session selectors, and zoom control -->
        <div class="l-time-conductor-controls l-row-elem l-flex-row flex-elem">
            <ConductorMode></ConductorMode>
            <ConductorTimeSystem></ConductorTimeSystem>
            <!-- Zoom control -->
            <div v-if="isUTCBased && isFixed"
                 class="l-time-conductor-zoom-w grows flex-elem l-flex-row">
                {{currentZoomText}}
                <span class="time-conductor-zoom-current-range flex-elem flex-fixed holder">{{timeUnits}}</span>
                <input class="time-conductor-zoom flex-elem" type="range"
                    v-model="currentZoom"
                    @change="setBoundsFromView()"
                    min="0.01"
                    step="0.01"
                    max="0.99" />
            </div>
        </div>

    </div>
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .l-time-conductor-inputs input:invalid {
        border: 1px solid $colorFormInvalid !important;
    }

    .l-time-conductor-zoom-w {
        text-transform: capitalize;
    }
</style>

<script>
import moment from 'moment';
import ConductorMode from './ConductorMode.vue';
import ConductorTimeSystem from './ConductorTimeSystem.vue';
import DatePicker from './DatePicker.vue';
import ConductorAxis from './ConductorAxis.vue';

const DEFAULT_DURATION_FORMATTER = 'duration';
const SECONDS = 1000;
const DAYS = 24 * 60 * 60 * SECONDS;
const YEARS = 365 * DAYS;

const MAX_ZOOM_OUT = 10 * YEARS;
const MAX_ZOOM_IN = 5 * SECONDS;
const RESIZE_POLL_INTERVAL = 200;

export default {
    inject: ['openmct', 'configuration'],
    components: {
        ConductorMode,
        ConductorTimeSystem,
        DatePicker,
        ConductorAxis
    },
    data() {
        let bounds = this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();
        let timeSystem = this.openmct.time.timeSystem();
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);

        return {
            currentZoom: this.calculateZoomFromBounds(),
            timeFormatter: timeFormatter,
            durationFormatter: durationFormatter,
            offsets: {
                start: offsets && durationFormatter.format(Math.abs(offsets.start)),
                end: offsets && durationFormatter.format(Math.abs(offsets.end)),
            },
            formattedBounds: {
                start: timeFormatter.format(bounds.start),
                end: timeFormatter.format(bounds.end)
            },
            rawBounds: {
                start: bounds.start,
                end: bounds.end
            },
            isFixed: this.openmct.time.clock() === undefined,
            isUTCBased: timeSystem.isUTCBased,
            showDatePicker: false
        }
    },
    methods: {
        setTimeSystem(timeSystem) {
            this.timeFormatter = this.getFormatter(timeSystem.timeFormat);
            this.durationFormatter = this.getFormatter(
                timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);

            this.isUTCBased = timeSystem.isUTCBased;
        },
        setOffsetsFromView($event) {
            if (this.offsetsChanged() && this.$refs.conductorForm.checkValidity()){
                let startOffset = 0 - this.durationFormatter.parse(this.offsets.start);
                let endOffset = this.durationFormatter.parse(this.offsets.end);

                this.openmct.time.clockOffsets({
                    start: startOffset, 
                    end: endOffset
                });
            }
            if ($event) {
                $event.preventDefault();
                return false;
            }
        },
        offsetsChanged() {
            let currentOffsets = this.openmct.time.clockOffsets();
            return this.offsets.start !== currentOffsets.start ||
                this.offsets.end !== currentOffsets.end;
        },
        setBoundsFromView($event) {
            if (this.boundsChanged() && this.$refs.conductorForm.checkValidity()){
                let start = this.timeFormatter.parse(this.formattedBounds.start);
                let end = this.timeFormatter.parse(this.formattedBounds.end);

                this.openmct.time.bounds({
                    start: start,
                    end: end
                });
            }
            if ($event) {
                $event.preventDefault();
                return false;
            }
        },
        boundsChanged() {
            let currentBounds = this.openmct.time.bounds();
            return this.timeFormatter.parse(this.formattedBounds.start) !== currentBounds.start ||
                this.timeFormatter.parse(this.formattedBounds.end) !== currentBounds.end;
        },
        showValidityMessage($event) {
            $event.target.reportValidity();
        },
        setViewFromClock(clock) {
            this.isFixed = clock === undefined;
        },
        setViewFromBounds(bounds) {
            this.formattedBounds.start = this.timeFormatter.format(bounds.start);
            this.formattedBounds.end = this.timeFormatter.format(bounds.end);
            this.rawBounds.start = bounds.start;
            this.rawBounds.end = bounds.end;
        },
        setViewFromOffsets(offsets) {
            this.offsets.start = this.durationFormatter.format(Math.abs(offsets.start));
            this.offsets.end = this.durationFormatter.format(Math.abs(offsets.end));
        },
        showValidityMessage($event) {
            $event.target.reportValidity();
        },
        validateBounds(startOrEnd, input) {
            let validationResult = true;

            if (!this.timeFormatter.validate(input.value)){
                validationResult = 'Invalid date value';
            } else {
                let boundsValues = {
                    start: this.timeFormatter.parse(this.formattedBounds.start),
                    end: this.timeFormatter.parse(this.formattedBounds.end)
                };
                validationResult = this.openmct.time.validateBounds(boundsValues);
            }
            
            if (validationResult !== true){
                input.setCustomValidity(validationResult);
            } else {
                input.setCustomValidity('');
            }
        },
        validateOffsets(event) {
            let input = event.target;
            let validationResult = true;

            if (!this.durationFormatter.validate(input.value)) {
                validationResult = 'Invalid offset value';
            } else {
                let offsetValues = {
                    start: 0 - this.durationFormatter.parse(this.offsets.start),
                    end: this.durationFormatter.parse(this.offsets.end)
                };
                validationResult = this.openmct.time.validateOffsets(offsetValues);
            }

            if (validationResult !== true){
                input.setCustomValidity(validationResult);
            } else {
                input.setCustomValidity('');
            }

        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        startDateSelected(date){
            this.formattedBounds.start = this.timeFormatter.format(date);
            this.validateBounds('start', this.$refs.startDate);
            this.setBoundsFromView();
        },
        endDateSelected(date){
            this.formattedBounds.end = this.timeFormatter.format(date);
            this.validateBounds('end', this.$refs.endDate);
            this.setBoundsFromView();
        },
        zoomLevelToTimespan() {
            let minMaxDelta = MAX_ZOOM_OUT - MAX_ZOOM_IN;
            return minMaxDelta * Math.pow((1 - this.currentZoom), 4);
        },
        zoom() {
            let zoomTimespan = this.zoomLevelToTimespan();
            let start = this.openmct.time.bounds().start;
            let end = this.openmct.time.bounds().end
            let currentTimeSpan = end - start;
            let delta = currentTimeSpan - zoomTimespan;
            let bounds = {
                start: start + delta / 2,
                end: end - delta / 2
            };
            this.rawBounds = bounds;
            this.setViewFromBounds(bounds);
            this.zooming = false;
        },
        calculateZoomFromBounds() {
            let start = this.openmct.time.bounds().start;
            let end = this.openmct.time.bounds().end
            let zoomMaxMinDelta = MAX_ZOOM_OUT - MAX_ZOOM_IN;
            let currentBoundsDelta = end - start;
            
            return 1 - Math.pow(currentBoundsDelta / zoomMaxMinDelta, 1 / 4);
        }

    },
    computed: {
        currentZoomText() {
            return moment.duration(this.zoomLevelToTimespan()).humanize();
        }
    },
    watch: {
        currentZoom() {
            if (!this.zooming) {
                this.zooming = true;
                requestAnimationFrame(this.zoom, RESIZE_POLL_INTERVAL);
            }
        }
    },
    mounted() {
        this.zooming = false;
        this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));

        this.openmct.time.on('bounds', this.setViewFromBounds);
        this.openmct.time.on('timeSystem', this.setTimeSystem);
        this.openmct.time.on('clock', this.setViewFromClock);
        this.openmct.time.on('clockOffsets', this.setViewFromOffsets)
    }
}
</script>


