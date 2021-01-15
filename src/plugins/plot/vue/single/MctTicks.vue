<template>
<div ref="tickContainer">
    <div v-if="position === 'left'"
         class="gl-plot-tick-wrapper"
    >
        <div v-for="tick in ticks"
             :key="tick.value"
             class="gl-plot-tick gl-plot-x-tick-label"
             :style="{
                 left: (100 * (tick.value - min) / interval) + '%'
             }"
             :title="tick.fullText || tick.text"
        >
            {{ tick.text }}
        </div>
    </div>
    <div v-if="position === 'top'"
         class="gl-plot-tick-wrapper"
    >
        <div v-for="tick in ticks"
             :key="tick.value"
             class="gl-plot-tick gl-plot-y-tick-label"
             :style="{ top: (100 * (max - tick.value) / interval) + '%' }"
             :title="tick.fullText || tick.text"
             style="margin-top: -0.50em; direction: ltr;"
        >
            <span>{{ tick.text }}</span>
        </div>
    </div>
    <!-- grid lines follow -->
    <div v-if="position === 'right'"
         class="gl-plot-tick-wrapper"
    >
        <div v-for="tick in ticks"
             :key="tick.value"
             class="gl-plot-hash hash-v"
             :style="{
                 right: (100 * (max - tick.value) / interval) + '%',
                 height: '100%'
             }"
        >
        </div>
    </div>
    <div v-if="position === 'bottom'"
         class="gl-plot-tick-wrapper"
    >
        <div v-for="tick in ticks"
             :key="tick.value"
             class="gl-plot-hash hash-h"
             :style="{ bottom: (100 * (tick.value - min) / interval) + '%', width: '100%' }"
        >
        </div>
    </div>
</div>
</template>

<script>
import eventHelpers from "./lib/eventHelpers";
import { ticks, commonPrefix, commonSuffix } from "./tickUtils";
import configStore from "./configuration/configStore";

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        axisType: {
            type: String,
            default() {
                return '';
            },
            required: true
        },
        position: {
            required: true,
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
            ticks: []
        };
    },
    mounted() {
        eventHelpers.extend(this);

        this.axis = this.getAxisFromConfig();

        this.tickCount = 4;
        this.tickUpdate = false;
        this.listenTo(this.axis, 'change:displayRange', this.updateTicks, this);
        this.listenTo(this.axis, 'change:format', this.updateTicks, this);
        this.listenTo(this.axis, 'change:key', this.updateTicksForceRegeneration, this);
        this.updateTicks();
    },
    beforeDestroy() {
        this.stopListening();
    },
    methods: {
        getAxisFromConfig() {
            if (!this.axisType) {
                return;
            }

            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (config) {
                return config[this.axisType];
            }
        },
        /**
       * Determine whether ticks should be regenerated for a given range.
       * Ticks are updated
       * a) if they don't exist,
       * b) if existing ticks are outside of given range,
       * c) if range exceeds size of tick range by more than one tick step,
       * d) if forced to regenerate (ex. changing x-axis metadata).
       *
       */
        shouldRegenerateTicks(range, forceRegeneration) {
            if (forceRegeneration) {
                return true;
            }

            if (!this.tickRange || !this.ticks || !this.ticks.length) {
                return true;
            }

            if (this.tickRange.max > range.max || this.tickRange.min < range.min) {
                return true;
            }

            if (Math.abs(range.max - this.tickRange.max) > this.tickRange.step) {
                return true;
            }

            if (Math.abs(this.tickRange.min - range.min) > this.tickRange.step) {
                return true;
            }

            return false;
        },

        getTicks() {
            const number = this.tickCount;
            const clampRange = this.axis.get('values');
            const range = this.axis.get('displayRange');
            if (clampRange) {
                return clampRange.filter(function (value) {
                    return value <= range.max && value >= range.min;
                }, this);
            }

            return ticks(range.min, range.max, number);
        },

        updateTicksForceRegeneration() {
            this.updateTicks(true);
        },

        updateTicks(forceRegeneration = false) {
            const range = this.axis.get('displayRange');
            if (!range) {
                delete this.min;
                delete this.max;
                delete this.interval;
                delete this.tickRange;
                this.ticks = [];
                delete this.shouldCheckWidth;

                return;
            }

            const format = this.axis.get('format');
            if (!format) {
                return;
            }

            this.min = range.min;
            this.max = range.max;
            this.interval = Math.abs(range.min - range.max);
            if (this.shouldRegenerateTicks(range, forceRegeneration)) {
                let newTicks = this.getTicks();
                this.tickRange = {
                    min: Math.min.apply(Math, newTicks),
                    max: Math.max.apply(Math, newTicks),
                    step: newTicks[1] - newTicks[0]
                };

                newTicks = newTicks
                    .map(function (tickValue) {
                        return {
                            value: tickValue,
                            text: format(tickValue)
                        };
                    }, this);

                if (newTicks.length && typeof newTicks[0].text === 'string') {
                    const tickText = newTicks.map(function (t) {
                        return t.text;
                    });
                    const prefix = tickText.reduce(commonPrefix);
                    const suffix = tickText.reduce(commonSuffix);
                    newTicks.forEach(function (t) {
                        t.fullText = t.text;
                        if (suffix.length) {
                            t.text = t.text.slice(prefix.length, -suffix.length);
                        } else {
                            t.text = t.text.slice(prefix.length);
                        }
                    });
                }

                this.ticks = newTicks;
                this.shouldCheckWidth = true;
            }

            this.scheduleTickUpdate();
        },

        scheduleTickUpdate() {
            if (this.tickUpdate) {
                return;
            }

            this.tickUpdate = true;
            setTimeout(this.doTickUpdate.bind(this), 0);
        },

        doTickUpdate() {
            if (this.shouldCheckWidth) {
                const tickElements = this.$refs.tickContainer.querySelectorAll('.gl-plot-tick > span');

                const tickWidth = Number([].reduce.call(tickElements, function (memo, first) {
                    return Math.max(memo, first.offsetWidth);
                }, 0));

                this.tickWidth = tickWidth;
                this.$emit('plotTickWidth', tickWidth);
                this.shouldCheckWidth = false;
            }

            this.tickUpdate = false;
        }
    }
};

</script>
