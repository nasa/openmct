<template>
<div
    class="c-tc-input-popup"
    :class="modeClass"
    :style="position"
    @click.stop
>
    <div
        class="c-tc-input-popup__options"
    >
        <IndependentMode
            v-if="isIndependent"
            class="c-button--compact c-conductor__mode-select"
            :mode="timeOptionMode"
            :button-css-class="'c-button--compact'"
            @independentModeUpdated="saveIndependentMode"
        />
        <ConductorMode
            v-else
            class="c-conductor__mode-select"
            :button-css-class="'c-icon-button'"
            @modeUpdated="saveMode"
        />
        <IndependentClock
            v-if="isIndependent"
            class="c-conductor__mode-select"
            :clock="timeOptionClock"
            :button-css-class="'c-icon-button'"
            @independentClockUpdated="saveIndependentClock"
        />
        <ConductorClock
            v-else
            class="c-conductor__mode-select"
            :button-css-class="'c-icon-button'"
            @clockUpdated="saveClock"
        />
        <!-- TODO: Time system and history must work even with ITC later -->
        <ConductorTimeSystem
            v-if="!isIndependent"
            class="c-conductor__time-system-select"
            :button-css-class="'c-icon-button'"
        />
        <ConductorHistory
            v-if="!isIndependent"
            class="c-conductor__history-select"
            :button-css-class="'c-icon-button'"
            :offsets="timeOffsets"
            :bounds="bounds"
            :time-system="timeSystem"
            :mode="timeMode"
        />
    </div>
    <conductor-inputs-fixed
        v-if="isFixed"
        :input-bounds="bounds"
        :object-path="objectPath"
        @boundsUpdated="saveFixedBounds"
        @dismissInputsFixed="dismiss"
    />
    <conductor-inputs-realtime
        v-else
        :input-bounds="bounds"
        :object-path="objectPath"
        @offsetsUpdated="saveClockOffsets"
        @dismissInputsRealtime="dismiss"
    />
</div>
</template>

<script>

import ConductorMode from './ConductorMode.vue';
import ConductorClock from './ConductorClock.vue';
import IndependentMode from './independent/IndependentMode.vue';
import IndependentClock from './independent/IndependentClock.vue';
import ConductorTimeSystem from "./ConductorTimeSystem.vue";
import ConductorHistory from "./ConductorHistory.vue";
import ConductorInputsFixed from "./ConductorInputsFixed.vue";
import ConductorInputsRealtime from "./ConductorInputsRealtime.vue";
import { TIME_CONTEXT_EVENTS, REALTIME_MODE_KEY, FIXED_MODE_KEY } from '../../api/time/constants';

export default {

    components: {
        ConductorMode,
        ConductorClock,
        IndependentMode,
        IndependentClock,
        ConductorTimeSystem,
        ConductorHistory,
        ConductorInputsFixed,
        ConductorInputsRealtime
    },
    inject: {
        openmct: 'openmct',
        configuration: {
            from: 'configuration',
            default: undefined
        }
    },
    props: {
        positionX: {
            type: Number,
            required: true
        },
        positionY: {
            type: Number,
            required: true
        },
        isFixed: {
            type: Boolean,
            required: true
        },
        isIndependent: {
            type: Boolean,
            default() {
                return false;
            }
        },
        timeOptions: {
            type: Object,
            default() {
                return undefined;
            }
        },
        bottom: {
            type: Boolean,
            default() {
                return false;
            }
        },
        objectPath: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        const bounds = this.openmct.time.getBounds();
        const timeSystem = this.openmct.time.getTimeSystem();
        // const isFixed = this.openmct.time.isFixed();

        return {
            timeSystem,
            bounds: {
                start: bounds.start,
                end: bounds.end
            }
        };
    },
    computed: {
        position() {
            const position = {
                left: `${this.positionX}px`
            };

            if (this.isIndependent) {
                position.top = `${this.positionY}px`;
            }

            return position;
        },
        timeOffsets() {
            return this.isFixed ? this.openmct.time.getBounds() : this.openmct.time.getClockOffsets();
        },
        timeMode() {
            return this.isFixed ? FIXED_MODE_KEY : REALTIME_MODE_KEY;
        },
        modeClass() {
            const value = this.bottom ? 'c-tc-input-popup--bottom' : '';

            return this.isFixed ? `${value} c-tc-input-popup--fixed-mode` : `${value} c-tc-input-popup--realtime-mode`;
        },
        timeOptionMode() {
            return this.timeOptions?.mode;
        },
        timeOptionClock() {
            return this.timeOptions?.clock;
        }
    },
    watch: {
        objectPath: {
            handler(newPath, oldPath) {
                //domain object or view has probably changed
                if (newPath === oldPath) {
                    return;
                }

                this.setTimeContext();
            },
            deep: true
        }
    },
    mounted() {
        this.$emit('popupLoaded');
        this.setTimeContext();
    },
    beforeDestroy() {
        this.stopFollowingTimeContext();
    },
    methods: {
        setTimeContext() {
            if (this.timeContext) {
                this.stopFollowingTimeContext();
            }

            this.timeContext = this.openmct.time.getContextForView(this.objectPath);

            this.timeContext.on(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
            this.timeContext.on(TIME_CONTEXT_EVENTS.boundsChanged, this.setBounds);
            this.timeContext.on(TIME_CONTEXT_EVENTS.modeChanged, this.setMode);

            this.setViewFromClock(this.timeContext.getClock());
            this.setBounds(this.timeContext.getBounds());
        },
        stopFollowingTimeContext() {
            this.timeContext.off(TIME_CONTEXT_EVENTS.clockChanged, this.setViewFromClock);
            this.timeContext.off(TIME_CONTEXT_EVENTS.boundsChanged, this.setBounds);
            this.timeContext.off(TIME_CONTEXT_EVENTS.modeChanged, this.setMode);
        },
        setViewFromClock() {
            this.bounds = this.isFixed ? this.timeContext.getBounds() : this.openmct.time.getClockOffsets();
            console.log('set view from clock popup', this.bounds);
        },
        setBounds(bounds, isTick) {
            if (this.isFixed || !isTick) {
                console.log('set bounds popup', bounds);
                this.bounds = bounds;
            }
        },
        setMode(mode) {
            // this.isFixed = mode === FIXED_MODE_KEY;
        },
        saveFixedBounds(bounds) {
            this.$emit('fixedBoundsUpdated', bounds);
        },
        saveClockOffsets(offsets) {
            this.$emit('clockOffsetsUpdated', offsets);
        },
        saveClock(clockOptions) {
            this.$emit('clockUpdated', clockOptions);
        },
        saveMode(mode) {
            this.$emit('modeUpdated', mode);
        },
        saveIndependentMode(mode) {
            this.$emit('independentModeUpdated', mode);
        },
        saveIndependentClock(clockKey) {
            this.$emit('independentClockUpdated', clockKey);
        },
        dismiss() {
            this.$emit('dismiss');
        }

    }

};

</script>
