<template>
<tr
    class="plot-legend-item"
    :class="{
        'is-status--missing': isMissing
    }"
>
    <td class="plot-series-swatch-and-name">
        <span class="plot-series-color-swatch"
              :style="{ 'background-color': colorAsHexString }"
        >
        </span>
        <span class="is-status__indicator"
              title="This item is missing or suspect"
        ></span>
        <span class="plot-series-name">{{ name }}</span>
    </td>

    <td v-if="showTimestampWhenExpanded">
        <span class="plot-series-value cursor-hover hover-value-enabled">
            {{ formattedXValue }}
        </span>
    </td>
    <td v-if="showValueWhenExpanded">
        <span class="plot-series-value cursor-hover hover-value-enabled"
              :class="[mctLimitStateClass]"
        >
            {{ formattedYValue }}
        </span>
    </td>
    <td v-if="showUnitsWhenExpanded">
        <span class="plot-series-value cursor-hover hover-value-enabled">
            {{ unit }}
        </span>
    </td>
    <td v-if="showMinimumWhenExpanded"
        class="mobile-hide"
    >
        <span class="plot-series-value">
            {{ formattedMinY }}
        </span>
    </td>
    <td v-if="showMaximumWhenExpanded"
        class="mobile-hide"
    >
        <span class="plot-series-value">
            {{ formattedMaxY }}
        </span>
    </td>
</tr>
</template>

<script>
export default {
    props: {
        seriesObject: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        },
        legend: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            showTimestampWhenExpanded: this.legend.get('showTimestampWhenExpanded'),
            showValueWhenExpanded: this.legend.get('showValueWhenExpanded'),
            showUnitsWhenExpanded: this.legend.get('showUnitsWhenExpanded'),
            showMinimumWhenExpanded: this.legend.get('showMinimumWhenExpanded'),
            showMaximumWhenExpanded: this.legend.get('showMaximumWhenExpanded'),
            isMissing: false,
            colorAsHexString: '',
            name: '',
            unit: '',
            formattedYValue: '',
            formattedXValue: '',
            formattedMinY: '',
            formattedMaxY: ''
        };
    },
    computed: {
        mctLimitStateClass() {
            return this.seriesObject.closest ? `${ this.seriesObject.closest.mctLimitState.cssClass }` : '';
        }
    },
    mounted() {
        this.isMissing = this.seriesObject.domainObject.status === 'missing';
        this.colorAsHexString = this.seriesObject.get('color').asHexString();
        this.name = this.seriesObject.get('name');
        this.unit = this.seriesObject.get('unit');
        this.formattedYValue = this.seriesObject.formatY(this.seriesObject.closest);
        this.formattedXValue = this.seriesObject.formatX(this.seriesObject.closest);
        const stats = this.seriesObject.get('stats');
        if (stats) {
            this.formattedMinY = this.seriesObject.formatY(stats.minPoint);
            this.formattedMaxY = this.seriesObject.formatY(stats.maxPoint);
        }
    }
};
</script>
