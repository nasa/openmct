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
import { TIME_CONTEXT_EVENTS } from "../../api/time/constants";

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
        const timeSystem = this.openmct.time.getTimeSystem();
        // let durationFormatter = this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        const timeFormatter = this.getFormatter(timeSystem.timeFormat);
        let bounds = this.inputBounds || this.openmct.time.getBounds();
        console.log('fixed input bounds', this.inputBounds);
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
            handler(newPath, oldPath) {
                if (newPath === oldPath) {
                    return;
                }

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
        this.openmct.time.on(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
        this.setTimeContext();
    },
    beforeDestroy() {
        this.openmct.time.off(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
        this.stopFollowingTimeContext();
    },
    methods: {
        setTimeContext() {
            this.stopFollowingTimeContext();
            this.timeContext = this.openmct.time.getContextForView(this.objectPath);

            this.handleNewBounds(this.timeContext.getBounds());
            this.timeContext.on(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
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
            console.log('conductor fixed bounds set bounds from view', bounds);
            this.$emit('boundsUpdated', {
                start: bounds.start,
                end: bounds.end
            });
        },
        dismiss() {
            this.$emit('dismissInputsFixed');
        }
    }
};
</script>
