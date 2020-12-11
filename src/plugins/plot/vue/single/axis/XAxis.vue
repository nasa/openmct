<template>
<div v-if="loaded"
     class="gl-plot-axis-area gl-plot-x has-local-controls"
>
    <mct-ticks :axis-type="'xAxis'"
               :position="'left'"
               @plotTickWidth="onTickWidthChange"
    />

    <div
        class="gl-plot-label gl-plot-x-label"
        :class="{'icon-gear': isEnabledXKeyToggle()}"
    >
        {{ xAxisLabel }}
    </div>

    <select
        v-show="isEnabledXKeyToggle()"
        v-model="selectedXKeyOptionKey"
        class="gl-plot-x-label__select local-controls--hidden"
        @change="toggleXKeyOption()"
    >
        <option v-for="option in xKeyOptions"
                :key="option.key"
                :value="option.key"
        >{{ option.name }}
        </option>
    </select>
</div>
</template>

<script>
import MctTicks from "../MctTicks.vue";
import eventHelpers from '../lib/eventHelpers';
import configStore from "../configuration/configStore";

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        MctTicks
    },
    props: {
        seriesModel: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            selectedXKeyOptionKey: '',
            xKeyOptions: [],
            xAxis: {},
            loaded: false,
            xAxisLabel: ''
        };
    },
    mounted() {
        eventHelpers.extend(this);
        this.xAxis = this.getXAxisFromConfig();
        this.loaded = true;
        this.setUpXAxisOptions();
        this.openmct.time.on('timeSystem', this.syncXAxisToTimeSystem);
        this.listenTo(this.xAxis, 'change', this.setUpXAxisOptions);
    },
    beforeDestroy() {
        this.openmct.time.off('timeSystem', this.syncXAxisToTimeSystem);
    },
    methods: {
        isEnabledXKeyToggle() {
            const isSinglePlot = this.xKeyOptions && this.xKeyOptions.length > 1 && this.seriesModel;
            const isFrozen = this.xAxis.get('frozen');
            const inRealTimeMode = this.openmct.time.clock();

            return isSinglePlot && !isFrozen && !inRealTimeMode;
        },
        getXAxisFromConfig() {
            const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let config = configStore.get(configId);
            if (config) {
                return config.xAxis;
            }
        },
        toggleXKeyOption() {
            const selectedXKey = this.selectedXKeyOptionKey;
            const dataForSelectedXKey = this.seriesModel.data
                ? this.seriesModel.data[0][selectedXKey]
                : undefined;

            if (dataForSelectedXKey !== undefined) {
                this.xAxis.set('key', selectedXKey);
            } else {
                this.openmct.notifications.error('Cannot change x-axis view as no data exists for this view type.');
                const xAxisKey = this.xAxis.get('key');
                this.selectedXKeyOptionKey = this.getXKeyOption(xAxisKey).key;
            }
        },
        getXKeyOption(key) {
            return this.xKeyOptions.find(option => option.key === key);
        },
        syncXAxisToTimeSystem(timeSystem) {
            const xAxisKey = this.xAxis.get('key');
            if (xAxisKey !== timeSystem.key) {
                this.xAxis.set('key', timeSystem.key);
                this.xAxis.resetSeries();
                this.setUpXAxisOptions();
            }
        },
        setUpXAxisOptions() {
            const xAxisKey = this.xAxis.get('key');

            this.xKeyOptions = this.seriesModel.metadata
                .valuesForHints(['domain'])
                .map(function (o) {
                    return {
                        name: o.name,
                        key: o.key
                    };
                });
            this.xAxisLabel = this.xAxis.get('label');
            this.selectedXKeyOptionKey = this.getXKeyOption(xAxisKey).key;
        },
        onTickWidthChange(width) {
            this.$emit('tickWidthChanged', width);
        }
    }
};
</script>
