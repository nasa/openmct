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
    <div v-show="showHighlights && (valueToShowWhenCollapsed !== 'none')"
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
        showHighlights: {
            type: Boolean,
            default() {
                return false;
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
            formattedYValueFromStats: ''
        };
    },
    computed: {
        mctLimitStateClass() {
            return this.seriesObject.closest ? `${ this.seriesObject.closest.mctLimitState.cssClass }` : '';
        },
        valueToDisplayWhenCollapsedClass() {
            return `value-to-display-${ this.valueToShowWhenCollapsed }`;
        },
        notNearest() {
            return (this.valueToShowWhenCollapsed.indexOf('nearest') > -1);
        }
    },
    mounted() {
        this.isMissing = this.seriesObject.domainObject.status === 'missing';
        this.colorAsHexString = this.seriesObject.get('color').asHexString();
        this.nameWithUnit = this.seriesObject.nameWithUnit();
        this.formattedYValue = this.seriesObject.closest && this.seriesObject.formatY(this.seriesObject.closest);
        this.formattedXValue = this.seriesObject.closest && this.seriesObject.formatX(this.seriesObject.closest);
        const stats = this.seriesObject.get('stats');
        if (stats) {
            this.formattedYValueFromStats = this.seriesObject.formatY(stats[this.valueToShowWhenCollapsed + 'Point']);
        }
    }
};

</script>
