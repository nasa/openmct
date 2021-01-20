<template>
<div v-if="loaded"
     class="gl-plot-axis-area gl-plot-y has-local-controls"
     :style="{
         width: (tickWidth + 20) + 'px'
     }"
>

    <div v-if="singleSeries"
         class="gl-plot-label gl-plot-y-label"
         :class="{'icon-gear': (yKeyOptions.length > 1)}"
    >{{ yAxisLabel }}
    </div>

    <select v-if="yKeyOptions.length > 1 && singleSeries"
            v-model="yAxisLabel"
            class="gl-plot-y-label__select local-controls--hidden"
            @change="toggleYAxisLabel"
    >
        <option v-for="(option, index) in yKeyOptions"
                :key="index"
                :value="option.name"
                :selected="option.name === yAxisLabel"
        >
            {{ option.name }}
        </option>
    </select>

    <mct-ticks :axis-type="'yAxis'"
               class="gl-plot-ticks"
               :position="'top'"
               @plotTickWidth="onTickWidthChange"
    />
</div>
</template>

<script>
import MctTicks from "../MctTicks.vue";
import configStore from "../configuration/configStore";

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        MctTicks
    },
    props: {
        singleSeries: {
            type: Boolean,
            default() {
                return true;
            }
        },
        seriesModel: {
            type: Object,
            default() {
                return {};
            }
        },
        tickWidth: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    data() {
        return {
            yAxisLabel: 'none',
            loaded: false
        };
    },
    mounted() {
        this.yAxis = this.getYAxisFromConfig();
        this.loaded = true;
        this.setUpYAxisOptions();
    },
    methods: {
        getYAxisFromConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (config) {
                return config.yAxis;
            }
        },
        setUpYAxisOptions() {
            this.yKeyOptions = this.seriesModel.metadata
                .valuesForHints(['range'])
                .map(function (o) {
                    return {
                        name: o.name,
                        key: o.key
                    };
                });

            //  set yAxisLabel if none is set yet
            if (this.yAxisLabel === 'none') {
                let yKey = this.seriesModel.model.yKey;
                let yKeyModel = this.yKeyOptions.filter(o => o.key === yKey)[0];

                this.yAxisLabel = yKeyModel.name;
            }
        },
        toggleYAxisLabel() {
            let yAxisObject = this.yKeyOptions.filter(o => o.name === this.yAxisLabel)[0];

            if (yAxisObject) {
                this.$emit('yKeyChanged', yAxisObject.key);
                this.yAxis.set('label', this.yAxisLabel);
            }
        },
        onTickWidthChange(width) {
            this.$emit('tickWidthChanged', width);
        }
    }
};
</script>
