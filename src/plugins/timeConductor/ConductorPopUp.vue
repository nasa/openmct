<template>
<div
    class="c-tc-input-popup"
    :class="modeClass"
    :style="position"
    @click.stop
    @keydown.enter.prevent
    @keyup.enter.prevent="submit"
    @keydown.esc.prevent
    @keyup.esc.prevent="hide"
>
    <div
        class="c-tc-input-popup__options"
    >
        <Mode
            v-if="isIndependent"
            class="c-button--compact c-conductor__mode-select"
            :mode="timeOptionMode"
            :button-css-class="'c-button--compact'"
            @modeChanged="saveIndependentMode"
        />
        <ConductorMode
            v-else
            class="c-conductor__mode-select"
            :button-css-class="'c-icon-button'"
            @updated="saveMode"
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
        @updated="saveFixedBounds"
        @dismiss="dismiss"
    />
    <conductor-inputs-realtime
        v-else
        :input-bounds="bounds"
        :object-path="objectPath"
        @updated="saveClockOffsets"
        @dismiss="dismiss"
    />
</div>
</template>

<script>

import ConductorMode from './ConductorMode.vue';
import Mode from './independent/Mode.vue';
import ConductorTimeSystem from "./ConductorTimeSystem.vue";
import ConductorHistory from "./ConductorHistory.vue";
import ConductorInputsFixed from "./ConductorInputsFixed.vue";
import ConductorInputsRealtime from "./ConductorInputsRealtime.vue";
import { REALTIME_MODE_KEY, FIXED_MODE_KEY } from '../../api/time/constants';

export default {

    components: {
        ConductorMode,
        Mode,
        ConductorTimeSystem,
        ConductorHistory,
        ConductorInputsFixed,
        ConductorInputsRealtime
    },
    inject: ['openmct', 'configuration'],
    props: {
        positionX: {
            type: Number,
            required: true
        },
        // positionY: {
        //     type: Number,
        //     required: true
        // },
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
        let bounds = this.openmct.time.getBounds();
        let timeSystem = this.openmct.time.getTimeSystem();
        let isFixed = this.openmct.time.isFixed();

        return {
            timeSystem,
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            isFixed
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
            return this.isFixed || !this.timeContext ? undefined : this.timeContext.getClockOffsets();
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
        this.setTimeContext();
    },
    beforeDestroy() {
        this.stopFollowingTimeContext();
    },
    methods: {
        setTimeContext() {
            this.stopFollowingTimeContext();
            this.timeContext = this.openmct.time.getContextForView(this.objectPath);

            if (this.timeContext) {
                this.timeContext.on('clockChanged', this.setViewFromClock);
                this.timeContext.on('boundsChanged', this.setBounds);
                this.timeContext.on('modeChanged', this.setMode);
            } else {
                this.openmct.time.on('clockChanged', this.setViewFromClock);
                this.openmct.time.on('boundsChanged', this.setBounds);
                this.openmct.time.on('modeChanged', this.setMode);
            }

            this.setViewFromClock(this.timeContext.getClock());
            this.setBounds(this.timeContext.getBounds());
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('clockChanged', this.setViewFromClock);
                this.timeContext.off('boundsChanged', this.setBounds);
                this.timeContext.off('modeChanged', this.setMode);
            } else {
                this.openmct.time.off('clockChanged', this.setViewFromClock);
                this.openmct.time.off('boundsChanged', this.setBounds);
                this.openmct.time.off('modeChanged', this.setMode);
            }
        },
        setViewFromClock() {
            this.bounds = this.timeContext ? this.timeContext.getBounds() : this.openmct.time.getBounds();
        },
        setBounds() {
            this.bounds = this.timeContext ? this.timeContext.getBounds() : this.openmct.time.getBounds();
        },
        setMode() {
            this.isFixed = this.timeContext ? this.timeContext.isFixed() : this.openmct.time.isFixed();
        },
        saveFixedBounds(bounds) {
            this.$emit('fixedBoundsUpdated', bounds);
        },
        saveClockOffsets(offsets) {
            console.log('conductor popup offsets', offsets);
            this.$emit('clockOffsetsUpdated', offsets);
        },
        saveMode(option) {
            this.$emit('modeUpdated', option);
        },
        saveIndependentMode(mode) {
            this.$emit('independentModeUpdated', mode);
        },
        dismiss() {
            this.$emit('dismiss');
        }

    }

};

</script>
