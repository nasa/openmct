<template>
<time-popup-realtime
    v-if="readOnly === false"
    :offsets="offsets"
    @focus.native="$event.target.select()"
    @update="timePopUpdate"
    @dismiss="dismiss"
/>
<div
    v-else
    class="c-compact-tc__bounds"
>
    <div class="c-compact-tc__bounds__value icon-minus">{{ offsets.start }}</div>
    <div
        v-if="compact"
        class="c-compact-tc__bounds__start-end-sep icon-arrows-right-left"
    ></div>
    <div
        v-else
        class="c-compact-tc__current-update"
    >
        LAST UPDATE {{ formattedBounds.end }}
    </div>
    <div class="c-compact-tc__bounds__value icon-plus">{{ offsets.end }}</div>
</div>
</template>

<script>

import TimePopupRealtime from "./timePopupRealtime.vue";
import _ from "lodash";

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    components: {
        TimePopupRealtime
    },
    inject: ['openmct'],
    props: {
        objectPath: {
            type: Array,
            default() {
                return [];
            }
        },
        inputBounds: {
            type: Object,
            default() {
                return undefined;
            }
        },
        readOnly: {
            type: Boolean,
            default() {
                return false;
            }
        },
        compact: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data() {
        let timeSystem = this.openmct.time.timeSystem();
        let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let bounds = this.bounds || this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();
        let currentValue = this.openmct.time.clock()?.currentValue();

        return {
            showTCInputStart: false,
            showTCInputEnd: false,
            durationFormatter,
            timeFormatter,
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            offsets: {
                start: offsets && durationFormatter.format(Math.abs(offsets.start)),
                end: offsets && durationFormatter.format(Math.abs(offsets.end))
            },
            formattedBounds: {
                start: timeFormatter.format(bounds.start),
                end: timeFormatter.format(bounds.end)
            },
            currentValue,
            formattedCurrentValue: timeFormatter.format(currentValue),
            isUTCBased: timeSystem.isUTCBased
        };
    },
    watch: {
        objectPath: {
            handler() {
                this.setTimeContext();
            },
            deep: true
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
        this.openmct.time.off('timeSystem', this.setTimeSystem);
        this.stopFollowingTime();
    },
    methods: {
        followTime() {
            this.handleNewBounds(this.timeContext.bounds());
            this.setViewFromOffsets(this.timeContext.clockOffsets());
            this.timeContext.on('bounds', this.handleNewBounds);
            this.timeContext.on('clockOffsets', this.setViewFromOffsets);
        },
        stopFollowingTime() {
            if (this.timeContext) {
                this.timeContext.off('bounds', this.handleNewBounds);
                this.timeContext.off('clockOffsets', this.setViewFromOffsets);
            }
        },
        setTimeContext() {
            this.stopFollowingTime();
            this.timeContext = this.openmct.time.getContextForView(this.objectPath);
            this.followTime();
        },
        handleNewBounds(bounds) {
            this.setBounds(bounds);
            this.setViewFromBounds(bounds);
            this.updateCurrentValue();
        },
        setViewFromOffsets(offsets) {
            if (offsets) {
                this.offsets.start = this.durationFormatter.format(Math.abs(offsets.start));
                this.offsets.end = this.durationFormatter.format(Math.abs(offsets.end));
            }
        },
        setBounds(bounds) {
            this.bounds = bounds;
        },
        setViewFromBounds(bounds) {
            this.formattedBounds.start = this.timeFormatter.format(bounds.start);
            this.formattedBounds.end = this.timeFormatter.format(bounds.end);
        },
        updateCurrentValue() {
            const currentValue = this.openmct.time.clock()?.currentValue();

            if (currentValue !== undefined) {
                this.setCurrentValue(currentValue);
            }
        },
        setCurrentValue(value) {
            this.currentValue = value;
            this.formattedCurrentValue = this.timeFormatter.format(value);
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
        timePopUpdate({ start, end }) {
            this.offsets.start = [start.hours, start.minutes, start.seconds].join(':');
            this.offsets.end = [end.hours, end.minutes, end.seconds].join(':');
            this.setOffsetsFromView();
        },
        setOffsetsFromView() {
            let startOffset = 0 - this.durationFormatter.parse(this.offsets.start);
            let endOffset = this.durationFormatter.parse(this.offsets.end);

            this.$emit('updated', {
                start: startOffset,
                end: endOffset
            });
        },
        dismiss() {
            this.$emit('dismiss');
        }
    }
};
</script>
