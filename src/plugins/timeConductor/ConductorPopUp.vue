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
        positionY: {
            type: Number,
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
        let bounds = this.openmct.time.bounds();
        let timeSystem = this.openmct.time.timeSystem();

        return {
            timeSystem: timeSystem,
            bounds: {
                start: bounds.start,
                end: bounds.end
            },
            isFixed: this.openmct.time.clock() === undefined
        };
    },
    computed: {
        position() {
            let positionX = this.positionX;
            let positionY = this.positionY;

            if (this.$el) {
                const popupDimensions = this.$el.getBoundingClientRect();

                let overflowX = (positionX + popupDimensions.width) - document.body.clientWidth;
                let overflowY = (positionY + popupDimensions.height) - document.body.clientHeight;

                if (overflowX > 0) {
                    positionX = positionX - overflowX;
                }

                if (overflowY > 0) {
                    positionY = positionY - overflowY;
                }

                if (positionX < 0) {
                    positionX = 0;
                }

                if (positionY < 0) {
                    positionY = 0;
                }
            }

            if (this.bottom) {
                return {
                    left: `${positionX}px`,
                    top: `${positionY}px`
                };
            } else {
                return {
                    left: `${positionX}px`
                };
            }
        },
        timeOffsets() {
            return this.isFixed || !this.timeContext ? undefined : this.timeContext.clockOffsets();
        },
        timeMode() {
            return this.isFixed ? 'fixed' : 'realtime';
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
            this.timeContext.on('clock', this.setViewFromClock);
            this.timeContext.on('bounds', this.setBounds);
            this.setViewFromClock(this.timeContext.clock());
            this.setBounds(this.timeContext.bounds());
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('clock', this.setViewFromClock);
                this.timeContext.off('bounds', this.setBounds);
            }
        },
        setViewFromClock(clock) {
            this.isFixed = clock === undefined;
            this.bounds = this.timeContext.bounds();
        },
        setBounds() {
            this.bounds = this.timeContext.bounds();
        },
        saveFixedBounds(bounds) {
            this.$emit('fixedBoundsUpdated', bounds);
        },
        saveClockOffsets(offsets) {
            this.$emit('clockOffsetsUpdated', offsets);
        },
        saveMode(option) {
            this.$emit('modeUpdated', option);
        },
        saveIndependentMode(mode) {
            this.isFixed = mode && mode.key === 'fixed';
            this.$emit('independentModeUpdated', mode);
        },
        dismiss() {
            this.$emit('dismiss');
        }

    }

};

</script>
