<template>
<div class="plot-legend-item"
     :class="{
         'is-status--missing': isMissing
     }"
>
    <div class="plot-series-swatch-and-name">
        <span class="plot-series-color-swatch"
              :style="{ 'background-color': colorAsHexString }"
        >
        </span>
        <span class="is-status__indicator"
              title="This item is missing or suspect"
        ></span>
        <span class="plot-series-name">{{ nameWithUnit }}</span>
    </div>
    <div v-show="!!highlights.length && (valueToShowWhenCollapsed !== 'none')"
         class="plot-series-value hover-value-enabled"
         :class="[{ 'cursor-hover': notNearest }, valueToDisplayWhenCollapsedClass, mctLimitStateClass]"
    >
        <span v-if="valueToShowWhenCollapsed === 'nearestValue'">{{ formattedYValue }}</span>
        <span v-else-if="valueToShowWhenCollapsed === 'nearestTimestamp'">{{ formattedXValue }}</span>
        <span v-else>{{ formattedYValueFromStats }}</span>
    </div>
</div>
</template>
<script>

export default {
    props: {
        valueToShowWhenCollapsed: {
            type: String,
            required: true
        },
        seriesObject: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        },
        highlights: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            isMissing: false,
            colorAsHexString: '',
            nameWithUnit: '',
            formattedYValue: '',
            formattedXValue: '',
            mctLimitStateClass: '',
            formattedYValueFromStats: ''
        };
    },
    computed: {
        valueToDisplayWhenCollapsedClass() {
            return `value-to-display-${ this.valueToShowWhenCollapsed }`;
        },
        notNearest() {
            return (this.valueToShowWhenCollapsed.indexOf('nearest') > -1);
        }
    },
    watch: {
        highlights: {
            handler() {
                this.initialize();
            }
        }
    },
    mounted() {
        this.initialize();
    },
    methods: {
        initialize() {
            const seriesObject = this.highlights.length ? this.highlights[0].series : this.seriesObject;
            this.isMissing = seriesObject.domainObject.status === 'missing';
            this.colorAsHexString = seriesObject.get('color').asHexString();
            this.nameWithUnit = seriesObject.nameWithUnit();

            const closest = seriesObject.closest;
            if (closest) {
                this.formattedYValue = seriesObject.formatY(closest);
                this.formattedXValue = seriesObject.formatX(closest);
                this.mctLimitStateClass = closest.mctLimitState ? `${closest.mctLimitState.cssClass}` : '';
            } else {
                this.formattedYValue = '';
                this.formattedXValue = '';
                this.mctLimitStateClass = '';
            }

            const stats = seriesObject.get('stats');
            if (stats) {
                this.formattedYValueFromStats = seriesObject.formatY(stats[this.valueToShowWhenCollapsed + 'Point']);
            } else {
                this.formattedYValueFromStats = '';
            }
        }
    }
};

</script>
