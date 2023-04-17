<template>
<div
    :style="position"
    class="c-tc-input-popup"
    :class="modeClass"
    @click.stop
    @keydown.enter.prevent
    @keyup.enter.prevent="submit"
    @keydown.esc.prevent
    @keyup.esc.prevent="hide"
>
    <div
        class="c-tc-input-popup__options"
    >
        <ConductorMode
            class="c-conductor__mode-select"
            :button-css-class="'c-icon-button'"
        />
        <ConductorTimeSystem
            class="c-conductor__time-system-select"
            :button-css-class="'c-icon-button'"
        />
        <ConductorHistory
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
        :input-bounds="viewBounds"
        @updated="saveFixedBounds"
        @dismiss="dismiss"
    />
    <conductor-inputs-realtime
        v-else
        :input-bounds="viewBounds"
        @updated="saveClockOffsets"
        @dismiss="dismiss"
    />
</div>
</template>

<script>
import ConductorMode from './ConductorMode.vue';
import ConductorTimeSystem from "./ConductorTimeSystem.vue";
import ConductorHistory from "./ConductorHistory.vue";
import ConductorInputsFixed from "./ConductorInputsFixed.vue";
import ConductorInputsRealtime from "./ConductorInputsRealtime.vue";

export default {

    components: {
        ConductorMode,
        ConductorTimeSystem,
        ConductorHistory,
        ConductorInputsFixed,
        ConductorInputsRealtime
    },
    inject: ['openmct'],
    props: {
        positionX: {
            type: Number,
            required: true
        },
        // positionY: {
        //     type: Number,
        //     required: true
        // },
        bottom: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data() {
        let bounds = this.openmct.time.bounds();
        let timeSystem = this.openmct.time.timeSystem();

        return {
            timeSystem: timeSystem,
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            viewBounds: {
                start: bounds.start,
                end: bounds.end
            },
            isFixed: this.openmct.time.clock() === undefined
        };
    },
    computed: {
        position() {
            return {
                left: `${this.positionX}px`
                // top: `${this.positionY}px`
            };
        },
        timeOffsets() {
            return this.openmct.time.clockOffsets();
        },
        timeMode() {
            return this.isFixed ? 'fixed' : 'realtime';
        },
        modeClass() {
            const value = this.bottom ? 'c-tc-input-popup--bottom' : '';

            return this.isFixed ? `${value} c-tc-input-popup--fixed-mode` : `${value} c-tc-input-popup--realtime-mode`;
        }
    },
    mounted() {
        this.openmct.time.on('clock', this.setViewFromClock);
        this.openmct.time.on('bounds', this.setBounds);
    },
    beforeDestroy() {
        this.openmct.time.off('clock', this.setViewFromClock);
        this.openmct.time.off('bounds', this.setBounds);
    },
    methods: {
        setViewFromClock(clock) {
            this.isFixed = clock === undefined;
            this.bounds = this.openmct.time.bounds();
        },
        setBounds() {
            this.bounds = this.openmct.time.bounds();
        },
        saveFixedBounds(bounds) {
            this.$emit('fixedBoundsUpdated', bounds);
        },
        saveClockOffsets(offsets) {
            this.$emit('fixedOffsetsUpdated', offsets);
        },
        dismiss() {
            this.$emit('dismiss');
        }

    }

};

</script>
