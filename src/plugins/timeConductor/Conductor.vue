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
    <div class="c-conductor"
         :class="[isFixed ? 'is-fixed-mode' : 'is-realtime-mode', panning ? 'status-panning' : '']">
        <form class="u-contents" ref="conductorForm"
              @submit="isFixed ? setBoundsFromView($event) : setOffsetsFromView($event)">

            <ConductorModeIcon class="c-conductor__mode-icon"></ConductorModeIcon>

            <div class="c-conductor__start-input">
                <!-- Start input and controls -->
                <div class="c-ctrl-wrapper c-conductor-input c-conductor__start__fixed"
                     v-if="isFixed">
                    <!-- Fixed input -->
                    <div class="c-conductor__start__fixed__label">Start</div>
                    <input class="c-input--datetime"
                           type="text" autocorrect="off" spellcheck="false"
                           ref="startDate"
                           v-model="formattedBounds.start"
                           @change="validateBounds('start', $event.target); setBoundsFromView()" />
                    <date-picker
                            :default-date-time="formattedBounds.start"
                            :formatter="timeFormatter"
                            @date-selected="startDateSelected"></date-picker>
                </div>

                <div class="c-ctrl-wrapper c-conductor-input c-conductor__start__delta"
                     v-if="!isFixed">
                    <!-- RT input -->
                    <div class="c-direction-indicator icon-minus"></div>
                    <input class="c-input--hrs-min-sec"
                           type="text" autocorrect="off"
                           spellcheck="false"
                           v-model="offsets.start"
                           @change="validateOffsets($event); setOffsetsFromView()">
                </div>
            </div>

            <div class="c-conductor__end-input">
                <!-- End input and controls -->
                <div class="c-ctrl-wrapper c-conductor-input c-conductor__end__fixed"
                     v-if="isFixed">
                    <!-- Fixed input -->
                    <div class="c-conductor__end__fixed__label">End</div>
                    <input class="c-input--datetime"
                           type="text" autocorrect="off" spellcheck="false"
                           v-model="formattedBounds.end"
                           :disabled="!isFixed"
                           ref="endDate"
                           @change="validateBounds('end', $event.target); setBoundsFromView()">
                    <date-picker
                            class="c-ctrl-wrapper--menus-left"
                            :default-date-time="formattedBounds.end"
                            :formatter="timeFormatter"
                            @date-selected="endDateSelected"></date-picker>
                </div>

                <div class="c-ctrl-wrapper c-conductor-input c-conductor__end__delta"
                     v-if="!isFixed">
                    <!-- RT input -->
                    <div class="c-direction-indicator icon-plus"></div>
                    <input class="c-input--hrs-min-sec"
                           type="text"
                           autocorrect="off"
                           spellcheck="false"
                           v-model="offsets.end"
                           @change="validateOffsets($event); setOffsetsFromView()">
                </div>
            </div>

            <conductor-axis
                    class="c-conductor__ticks"
                    :bounds="rawBounds"
                    @panAxis="setViewFromBounds"></conductor-axis>
            <div class="c-conductor__controls">
                <!-- Mode, time system menu buttons and duration slider -->
                <ConductorMode class="c-conductor__mode-select"></ConductorMode>
                <ConductorTimeSystem class="c-conductor__time-system-select"></ConductorTimeSystem>
            </div>
            <input type="submit" class="invisible">
        </form>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /*********************************************** CONDUCTOR LAYOUT */
    .c-conductor {
        display: grid;
        grid-column-gap: $interiorMargin;
        grid-row-gap: $interiorMargin;
        align-items: center;


        grid-template-rows: 1fr 1fr;
        grid-template-columns: 20px auto 1fr auto;
        grid-template-areas:
                "tc-mode-icon tc-start tc-ticks tc-end"
                "tc-controls tc-controls tc-controls tc-controls";

        .c-conductor__end-input {
            justify-content: flex-end;
        }

        body.phone.portrait & {
            &.is-fixed-mode {
                grid-row-gap: $interiorMargin;
                grid-template-rows: auto auto auto;
                grid-template-columns: 20px auto;
                grid-template-areas:
                        "tc-mode-icon tc-start"
                        "tc-mode-icon tc-end"
                        "tc-mode-icon tc-controls";

                .c-conductor {
                    &__mode-icon {
                        grid-row: 1;
                    }

                    &__ticks,
                    &__zoom {
                        display: none;
                    }

                    &-input [class*='__label'] {
                        // Start and end are in separate columns; make the labels line up
                        width: 40px;
                    }

                    &__end-input {
                        justify-content: flex-start;
                    }
                }
            }
        }

        &__mode-icon {
            grid-area: tc-mode-icon;
        }

        &__start-input,
        &__end-input {
            display: flex;
        }

        &__start-input {
            grid-area: tc-start;
        }

        &__end-input {
            grid-area: tc-end;
            display: flex;
        }

        &__ticks {
            grid-area: tc-ticks;
        }

        &__controls {
            grid-area: tc-controls;
            display: flex;
            align-items: center;
            > * + * {
                margin-left: $interiorMargin;
            }
        }

        [class*='__delta'] {
            &:before {
                content: $glyph-icon-clock;
                font-family: symbolsfont;
            }
        }
    }

    .c-conductor-input {
        color: $colorInputFg;
        display: flex;
        align-items: center;
        justify-content: flex-start;

        > * + * {
            margin-left: $interiorMarginSm;
        }

        &:before {
            // Realtime-mode clock icon symbol
            margin-right: $interiorMarginSm;
        }

        .c-direction-indicator {
            // Holds realtime-mode + and - symbols
            font-size: 0.7em;
        }

        input:invalid {
            background: rgba($colorFormInvalid, 0.3);
        }
    }

    .is-realtime-mode {
        .c-conductor-input {
            &:before {
                color: $colorTime;
            }
        }
    }
</style>

<script>
import moment from 'moment';
import ConductorMode from './ConductorMode.vue';
import ConductorTimeSystem from './ConductorTimeSystem.vue';
import DatePicker from './DatePicker.vue';
import ConductorAxis from './ConductorAxis.vue';
import ConductorModeIcon from './ConductorModeIcon.vue';

const DEFAULT_DURATION_FORMATTER = 'duration';
const SECONDS = 1000;
const DAYS = 24 * 60 * 60 * SECONDS;
const YEARS = 365 * DAYS;

const RESIZE_POLL_INTERVAL = 200;

export default {
    inject: ['openmct', 'configuration'],
    components: {
        ConductorMode,
        ConductorTimeSystem,
        DatePicker,
        ConductorAxis,
        ConductorModeIcon
    },
    data() {
        let bounds = this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();
        let timeSystem = this.openmct.time.timeSystem();
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);

        return {
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
            if (this.$refs.conductorForm.checkValidity()){
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
        setBoundsFromView($event) {
            if (this.$refs.conductorForm.checkValidity()){
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
    },
    mounted() {
        this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));

        this.openmct.time.on('bounds', this.setViewFromBounds);
        this.openmct.time.on('timeSystem', this.setTimeSystem);
        this.openmct.time.on('clock', this.setViewFromClock);
        this.openmct.time.on('clockOffsets', this.setViewFromOffsets)
    }
}
</script>


