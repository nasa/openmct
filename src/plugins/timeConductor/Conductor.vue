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
         :class="[isFixed ? 'is-fixed-mode' : 'is-realtime-mode']">
        <form class="u-contents" ref="conductorForm" @submit.prevent="updateTimeFromConductor">
            <div class="c-conductor__time-bounds">
                <button class="c-input--submit" type="submit" ref="submitButton"></button>
                <ConductorModeIcon class="c-conductor__mode-icon"></ConductorModeIcon>

                <div class="c-ctrl-wrapper c-conductor-input c-conductor__start-fixed"
                     v-if="isFixed">
                    <!-- Fixed start -->
                    <div class="c-conductor__start-fixed__label">Start</div>
                    <input class="c-input--datetime"
                           type="text" autocorrect="off" spellcheck="false"
                           ref="startDate"
                           v-model="formattedBounds.start"
                           @change="validateAllBounds(); submitForm()" />
                    <date-picker
                            v-if="isFixed && isUTCBased"
                            :default-date-time="formattedBounds.start"
                            :formatter="timeFormatter"
                            @date-selected="startDateSelected"></date-picker>
                </div>

                <div class="c-ctrl-wrapper c-conductor-input c-conductor__start-delta"
                     v-if="!isFixed">
                    <!-- RT start -->
                    <div class="c-direction-indicator icon-minus"></div>
                    <input class="c-input--hrs-min-sec"
                           type="text" autocorrect="off"
                           ref="startOffset"
                           spellcheck="false"
                           v-model="offsets.start"
                           @change="validateAllOffsets(); submitForm()">
                </div>

                <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-fixed">
                    <!-- Fixed end and RT 'last update' display -->
                    <div class="c-conductor__end-fixed__label">
                        {{ isFixed ? 'End' : 'Updated' }}
                    </div>
                    <input class="c-input--datetime"
                           type="text" autocorrect="off" spellcheck="false"
                           v-model="formattedBounds.end"
                           :disabled="!isFixed"
                           ref="endDate"
                           @change="validateAllBounds(); submitForm()">
                    <date-picker
                            v-if="isFixed && isUTCBased"
                            class="c-ctrl-wrapper--menus-left"
                            :default-date-time="formattedBounds.end"
                            :formatter="timeFormatter"
                            @date-selected="endDateSelected"></date-picker>
                </div>

                <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-delta"
                     v-if="!isFixed">
                    <!-- RT end -->
                    <div class="c-direction-indicator icon-plus"></div>
                    <input class="c-input--hrs-min-sec"
                           type="text"
                           autocorrect="off"
                           spellcheck="false"
                           ref="endOffset"
                           v-model="offsets.end"
                           @change="validateAllOffsets(); submitForm()">
                </div>

                <conductor-axis
                    class="c-conductor__ticks"
                    :bounds="rawBounds"
                    :isFixed="isFixed"
                    @panAxis="setViewFromBounds"
                    @zoomAxis="setViewFromBounds"
                ></conductor-axis>

            </div>
            <div class="c-conductor__controls">
                <ConductorMode class="c-conductor__mode-select"></ConductorMode>
                <ConductorTimeSystem class="c-conductor__time-system-select"></ConductorTimeSystem>
                <ConductorHistory
                    v-if="isFixed"
                    class="c-conductor__history-select"
                    :bounds="rawBounds"
                    :time-system="timeSystem"
                    @selectTimespan="setViewFromBounds"
                ></ConductorHistory>
            </div>
            <input type="submit" class="invisible">
        </form>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-input--submit {
        // Can't use display: none because some browsers will pretend the input doesn't exist, and enter won't work
        visibility: none;
        height: 0;
        width: 0;
        padding: 0;
    }

    /*********************************************** CONDUCTOR LAYOUT */
    .c-conductor {
        &__time-bounds {
            display: grid;
            grid-column-gap: $interiorMargin;
            grid-row-gap: $interiorMargin;
            align-items: center;

            // Default: fixed mode, desktop
            grid-template-rows: 1fr;
            grid-template-columns: 20px auto 1fr auto;
            grid-template-areas: "tc-mode-icon tc-start tc-ticks tc-end";
        }

        &__mode-icon {
            grid-area: tc-mode-icon;
        }

        &__start-fixed,
        &__start-delta {
            grid-area: tc-start;
            display: flex;
        }

        &__end-fixed,
        &__end-delta {
            grid-area: tc-end;
            display: flex;
            justify-content: flex-end;
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

        [class*='-delta'] {
            &:before {
                content: $glyph-icon-clock;
                font-family: symbolsfont;
            }
        }

        &.is-realtime-mode {
            .c-conductor__time-bounds {
                grid-template-columns: 20px auto 1fr auto auto;
                grid-template-areas: "tc-mode-icon tc-start tc-ticks tc-updated tc-end";
            }

            .c-conductor__end-fixed {
                grid-area: tc-updated;
            }
        }

        body.phone.portrait & {
            .c-conductor__time-bounds {
                grid-row-gap: $interiorMargin;
                grid-template-rows: auto auto;
                grid-template-columns: 20px auto auto;
            }

            .c-conductor__controls {
                padding-left: 25px; // Line up visually with other controls
            }

            &__mode-icon {
                grid-row: 1;
            }

            &__ticks,
            &__zoom {
                display: none;
            }

            &.is-fixed-mode {
                [class*='__start-fixed'],
                [class*='__end-fixed'] {
                    [class*='__label'] {
                        // Start and end are in separate columns; make the labels line up
                        width: 30px;
                    }
                }

                [class*='__end-input'] {
                    justify-content: flex-start;
                }

                .c-conductor__time-bounds {
                    grid-template-areas:
                        "tc-mode-icon tc-start tc-start"
                        "tc-mode-icon tc-end tc-end"
                    }
                }

            &.is-realtime-mode {
                .c-conductor__time-bounds {
                    grid-template-areas:
                        "tc-mode-icon tc-start tc-updated"
                        "tc-mode-icon tc-end tc-end";
                }

                .c-conductor__end-fixed {
                    justify-content: flex-end;
                }
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
            background: rgba($colorFormInvalid, 0.5);
        }
    }

    .is-realtime-mode {
        button {
            @include themedButton($colorTimeBg);
            color: $colorTimeFg;

            &:hover {
                background: $colorTimeHov !important;
                color: $colorTimeFg !important;
            }
        }

        .c-conductor-input {
            &:before {
                color: $colorTime;
            }
        }

        .c-conductor__end-fixed {
            // Displays last RT udpate
            color: $colorTime;

            input {
                // Remove input look
                background: none;
                box-shadow: none;
                color: $colorTime;
                pointer-events: none;
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
import ConductorHistory from './ConductorHistory.vue'

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
        ConductorModeIcon,
        ConductorHistory
    },
    data() {
        let bounds = this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();
        let timeSystem = this.openmct.time.timeSystem();
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);

        return {
            timeSystem: timeSystem,
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
            this.timeSystem = timeSystem
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
            this.clearAllValidation();
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
        updateTimeFromConductor() {
            if (this.isFixed) {
                this.setBoundsFromView();
            } else {
                this.setOffsetsFromView();
            }
        },
        clearAllValidation() {
            if (this.isFixed) {
                [this.$refs.startDate, this.$refs.endDate].forEach(this.clearValidationForInput);
            } else {
                [this.$refs.startOffset, this.$refs.endOffset].forEach(this.clearValidationForInput);
            }
        },
        clearValidationForInput(input){
            input.setCustomValidity('');
            input.title = '';
        },
        validateAllBounds() {
            return [this.$refs.startDate, this.$refs.endDate].every((input) => {
                let validationResult = true;
                let formattedDate;

                if (input === this.$refs.startDate) {
                    formattedDate = this.formattedBounds.start;
                } else {
                    formattedDate = this.formattedBounds.end;
                }

                if (!this.timeFormatter.validate(formattedDate)){
                    validationResult = 'Invalid date';
                } else {
                    let boundsValues = {
                        start: this.timeFormatter.parse(this.formattedBounds.start),
                        end: this.timeFormatter.parse(this.formattedBounds.end)
                    };
                    validationResult = this.openmct.time.validateBounds(boundsValues);
                }
                
                if (validationResult !== true){
                    input.setCustomValidity(validationResult);
                    input.title = validationResult;
                    return false;
                } else {
                    input.setCustomValidity('');
                    input.title = '';
                    return true;
                }
            });
        },
        validateAllOffsets(event) {
            return [this.$refs.startOffset, this.$refs.endOffset].every((input) => {
                let validationResult = true;
                let formattedOffset;

                if (input === this.$refs.startOffset) {
                    formattedOffset = this.offsets.start;
                } else {
                    formattedOffset = this.offsets.end;
                }

                if (!this.durationFormatter.validate(formattedOffset)) {
                    validationResult = 'Offsets must be in the format hh:mm:ss and less than 24 hours in duration';
                } else {
                    let offsetValues = {
                        start: 0 - this.durationFormatter.parse(this.offsets.start),
                        end: this.durationFormatter.parse(this.offsets.end)
                    };
                    validationResult = this.openmct.time.validateOffsets(offsetValues);
                }

                if (validationResult !== true){
                    input.setCustomValidity(validationResult);
                    input.title = validationResult;
                    return false;
                } else {
                    input.setCustomValidity('');
                    input.title = '';
                    return true;
                }
            });
        },
        submitForm() {
            // Allow Vue model to catch up to user input.
            // Submitting form will cause validation messages to display (but only if triggered by button click)
            this.$nextTick(() => this.$refs.submitButton.click());
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        startDateSelected(date){
            this.formattedBounds.start = this.timeFormatter.format(date);
            this.validateAllBounds();
            this.submitForm();
        },
        endDateSelected(date){
            this.formattedBounds.end = this.timeFormatter.format(date);
            this.validateAllBounds();
            this.submitForm();
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
