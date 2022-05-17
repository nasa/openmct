<template>
<div
    class="c-tc-input-popup"
    :class="{'c-tc-input-popup--bottom' : bottom === true}"
    @keydown.enter.prevent
    @keyup.enter.prevent="submit"
    @keydown.esc.prevent
    @keyup.esc.prevent="hide"
    @click.stop
>
    <div class="c-tc-input-popup__options c-tc-input-popup__options--fixed">
        Buttons here
    </div>
    <!-- PASTED FROM ConductorInputsFixed -->
    <form
        ref="fixedDeltaInput"
        class="c-tc-input-popup__input-grid"
    >
        <div class="pr-time-label"><em>Start</em> Date</div>
        <div class="pr-time-label">Time Z</div>
        <div class="pr-time-label"></div>
        <div class="pr-time-label"><em>End</em> Date</div>
        <div class="pr-time-label">Time Z</div>
        <div class="pr-time-label"></div>

        <div class="pr-time-input pr-time-input--date pr-time-input--input-and-button">
            <input
                ref="startDate"
                v-model="formattedBounds.start"
                class="c-input--datetime"
                type="text"
                autocorrect="off"
                spellcheck="false"
                @change="validateAllBounds('startDate'); submitForm()"
            >
            <date-picker
                v-if="isUTCBased"
                class="c-ctrl-wrapper--menus-left"
                :bottom="keyString !== undefined"
                :default-date-time="formattedBounds.start"
                :formatter="timeFormatter"
                @date-selected="startDateSelected"
            />
        </div>

        <div class="pr-time-input">
            <input
                ref="startTime"
                v-model="formattedBounds.start"
                class="c-input--datetime"
                type="text"
                autocorrect="off"
                spellcheck="false"
            >
        </div>

        <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

        <div class="pr-time-input pr-time-input--date pr-time-input--input-and-button">
            <input
                ref="startDate"
                v-model="formattedBounds.start"
                class="c-input--datetime"
                type="text"
                autocorrect="off"
                spellcheck="false"
                @change="validateAllBounds('startDate'); submitForm()"
            >
            <date-picker
                v-if="isUTCBased"
                class="c-ctrl-wrapper--menus-left"
                :bottom="keyString !== undefined"
                :default-date-time="formattedBounds.start"
                :formatter="timeFormatter"
                @date-selected="startDateSelected"
            />
        </div>

        <div class="pr-time-input">
            <input
                ref="startTime"
                v-model="formattedBounds.start"
                class="c-input--datetime"
                type="text"
                autocorrect="off"
                spellcheck="false"
            >
        </div>

        <div class="pr-time-input pr-time-input--buttons">
            <button
                class="c-button c-button--major icon-check"
                :disabled="false"
                @click.prevent="submit"
            ></button>
            <button
                class="c-button icon-x"
                @click.prevent="hide"
            ></button>
        </div>

        <div
            v-if="false"
            class="c-ctrl-wrapper c-conductor-input c-conductor__start-fixed"
        >
            <!-- Fixed start -->
            <div class="c-conductor__start-fixed__label">
                Start
            </div>
            <input
                ref="startDate"
                v-model="formattedBounds.start"
                class="c-input--datetime"
                type="text"
                autocorrect="off"
                spellcheck="false"
                @change="validateAllBounds('startDate'); submitForm()"
            >
            <date-picker
                v-if="isUTCBased"
                class="c-ctrl-wrapper--menus-left"
                :bottom="keyString !== undefined"
                :default-date-time="formattedBounds.start"
                :formatter="timeFormatter"
                @date-selected="startDateSelected"
            />
        </div>
        <div
            v-if="false"
            class="c-ctrl-wrapper c-conductor-input c-conductor__end-fixed"
        >
            <!-- Fixed end and RT 'last update' display -->
            <div class="c-conductor__end-fixed__label">
                End
            </div>
            <input
                ref="endDate"
                v-model="formattedBounds.end"
                class="c-input--datetime"
                type="text"
                autocorrect="off"
                spellcheck="false"
                @change="validateAllBounds('endDate'); submitForm()"
            >
            <date-picker
                v-if="isUTCBased"
                class="c-ctrl-wrapper--menus-left"
                :bottom="keyString !== undefined"
                :default-date-time="formattedBounds.end"
                :formatter="timeFormatter"
                @date-selected="endDateSelected"
            />
        </div>
    </form>
</div>
</template>

<script>
import _ from "lodash";
import DatePicker from "./DatePicker.vue";

export default {
    components: {
        DatePicker
    },
    inject: ['openmct'],
    props: {
        bottom: {
            type: Boolean,
            default() {
                return false;
            }
        },
        type: {
            type: String,
            required: true
        },
        offset: {
            type: String,
            required: true
        },
        mode: {
            type: String,
            required: true
        }
    },
    data() {
        let timeSystem = this.openmct.time.timeSystem();
        let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let bounds = this.bounds || this.openmct.time.bounds();

        return {
            showTCInputStart: true,
            showTCInputEnd: true,
            durationFormatter,
            timeFormatter,
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            formattedBounds: {
                start: timeFormatter.format(bounds.start),
                end: timeFormatter.format(bounds.end)
            },
            isUTCBased: timeSystem.isUTCBased
        };
    },
    watch: {
        keyString() {
            this.setTimeContext();
        },
        inputBounds: {
            handler(newBounds) {
                this.handleNewBounds(newBounds);
            },
            deep: true
        }
    },
    mounted() {
        this.handleNewBounds = _.throttle(this.handleNewBounds, 300);
        this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));
        this.openmct.time.on('timeSystem', this.setTimeSystem);
        this.setTimeContext();
    },
    beforeDestroy() {
        this.clearAllValidation();
        this.openmct.time.off('timeSystem', this.setTimeSystem);
        this.stopFollowingTimeContext();
    },
    methods: {
        setTimeContext() {
            this.stopFollowingTimeContext();
            this.timeContext = this.openmct.time.getContextForView(this.keyString ? [{identifier: this.keyString}] : []);

            this.handleNewBounds(this.timeContext.bounds());
            this.timeContext.on('bounds', this.handleNewBounds);
            this.timeContext.on('clock', this.clearAllValidation);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('bounds', this.handleNewBounds);
                this.timeContext.off('clock', this.clearAllValidation);
            }
        },
        handleNewBounds(bounds) {
            this.setBounds(bounds);
            this.setViewFromBounds(bounds);
        },
        clearAllValidation() {
            [this.$refs.startDate, this.$refs.endDate].forEach(this.clearValidationForInput);
        },
        clearValidationForInput(input) {
            input.setCustomValidity('');
            input.title = '';
        },
        setBounds(bounds) {
            this.bounds = bounds;
        },
        setViewFromBounds(bounds) {
            this.formattedBounds.start = this.timeFormatter.format(bounds.start);
            this.formattedBounds.end = this.timeFormatter.format(bounds.end);
        },
        setTimeSystem(timeSystem) {
            this.timeSystem = timeSystem;
            this.timeFormatter = this.getFormatter(timeSystem.timeFormat);
            this.durationFormatter = this.getFormatter(
                timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            this.isUTCBased = timeSystem.isUTCBased;
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        setBoundsFromView($event) {
            if (this.$refs.fixedDeltaInput.checkValidity()) {
                let start = this.timeFormatter.parse(this.formattedBounds.start);
                let end = this.timeFormatter.parse(this.formattedBounds.end);

                this.$emit('updated', {
                    start: start,
                    end: end
                });
            }

            if ($event) {
                $event.preventDefault();

                return false;
            }
        },
        submitForm() {
            // Allow Vue model to catch up to user input.
            // Submitting form will cause validation messages to display (but only if triggered by button click)
            this.$nextTick(() => this.setBoundsFromView());
        },
        validateAllBounds(ref) {
            if (!this.areBoundsFormatsValid()) {
                return false;
            }

            let validationResult = {
                valid: true
            };
            const currentInput = this.$refs[ref];

            return [this.$refs.startDate, this.$refs.endDate].every((input) => {
                let boundsValues = {
                    start: this.timeFormatter.parse(this.formattedBounds.start),
                    end: this.timeFormatter.parse(this.formattedBounds.end)
                };
                //TODO: Do we need limits here? We have conductor limits disabled right now
                // const limit = this.getBoundsLimit();
                const limit = false;

                if (this.timeSystem.isUTCBased && limit
                    && boundsValues.end - boundsValues.start > limit) {
                    if (input === currentInput) {
                        validationResult = {
                            valid: false,
                            message: "Start and end difference exceeds allowable limit"
                        };
                    }
                } else {
                    if (input === currentInput) {
                        validationResult = this.openmct.time.validateBounds(boundsValues);
                    }
                }

                return this.handleValidationResults(input, validationResult);
            });
        },
        areBoundsFormatsValid() {
            let validationResult = {
                valid: true
            };

            return [this.$refs.startDate, this.$refs.endDate].every((input) => {
                const formattedDate = input === this.$refs.startDate
                    ? this.formattedBounds.start
                    : this.formattedBounds.end
                ;

                if (!this.timeFormatter.validate(formattedDate)) {
                    validationResult = {
                        valid: false,
                        message: 'Invalid date'
                    };
                }

                return this.handleValidationResults(input, validationResult);
            });
        },
        getBoundsLimit() {
            const configuration = this.configuration.menuOptions
                .filter(option => option.timeSystem === this.timeSystem.key)
                .find(option => option.limit);

            const limit = configuration ? configuration.limit : undefined;

            return limit;
        },
        handleValidationResults(input, validationResult) {
            if (validationResult.valid !== true) {
                input.setCustomValidity(validationResult.message);
                input.title = validationResult.message;
            } else {
                input.setCustomValidity('');
                input.title = '';
            }

            this.$refs.fixedDeltaInput.reportValidity();

            return validationResult.valid;
        },
        startDateSelected(date) {
            this.formattedBounds.start = this.timeFormatter.format(date);
            this.validateAllBounds('startDate');
            this.submitForm();
        },
        endDateSelected(date) {
            this.formattedBounds.end = this.timeFormatter.format(date);
            this.validateAllBounds('endDate');
            this.submitForm();
        },
        hideAllTimePopups() {
            this.showTCInputStart = false;
            this.showTCInputEnd = false;
        },
        showTimePopupStart() {
            this.hideAllTimePopups();
            this.showTCInputStart = !this.showTCInputStart;
        }
    }
};
</script>
