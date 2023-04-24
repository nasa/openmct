<template>
<time-popup-fixed
    v-if="readOnly === false"
    :input-bounds="bounds"
    :input-time-system="timeSystem"
    @focus.native="$event.target.select()"
    @update="setBoundsFromView"
    @dismiss="dismiss"
/>
<div
    v-else
    class="c-compact-tc__bounds"
>
    <div class="c-compact-tc__bounds__value">{{ formattedBounds.start }}</div>
    <div class="c-compact-tc__bounds__start-end-sep icon-arrows-right-left"></div>
    <div class="c-compact-tc__bounds__value">{{ formattedBounds.end }}</div>
</div>
</template>

<script>
import TimePopupFixed from "./timePopupFixed.vue";
import _ from "lodash";

// const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    components: {
        TimePopupFixed
    },
    inject: ['openmct'],
    props: {
        inputBounds: {
            type: Object,
            default() {
                return undefined;
            }
        },
        objectPath: {
            type: Array,
            default() {
                return [];
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
        // let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        let timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let bounds = this.bounds || this.openmct.time.bounds();

        return {
            timeSystem: timeSystem,
            // durationFormatter,
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
        this.stopFollowingTimeContext();
    },
    methods: {
        setTimeContext() {
            this.stopFollowingTimeContext();
            this.timeContext = this.openmct.time.getContextForView(this.objectPath);

            this.handleNewBounds(this.timeContext.bounds());
            this.timeContext.on('bounds', this.handleNewBounds);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('bounds', this.handleNewBounds);
            }
        },
        handleNewBounds(bounds) {
            this.setBounds(bounds);
            this.setViewFromBounds(bounds);
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
            // this.durationFormatter = this.getFormatter(
            //     timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            this.isUTCBased = timeSystem.isUTCBased;
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        setBoundsFromView(bounds) {
            this.$emit('updated', {
                start: bounds.start,
                end: bounds.end
            });
        },
        dismiss() {
            this.$emit('dismiss');
        }
    }
};
</script>
