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
        highlights: {
            type: Array,
            default() {
                return [];
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
            formattedMaxY: '',
            mctLimitStateClass: ''
        };
    },
    watch: {
        highlights() {
            this.initialize();
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
            this.name = seriesObject.get('name');
            this.unit = seriesObject.get('unit');
            const closest = seriesObject.closest;
            if (closest) {
                this.formattedYValue = seriesObject.formatY(closest);
                this.formattedXValue = seriesObject.formatX(closest);
                this.mctLimitStateClass = seriesObject.closest.mctLimitState ? seriesObject.closest.mctLimitState.cssClass : '';
            } else {
                this.formattedYValue = '';
                this.formattedXValue = '';
                this.mctLimitStateClass = '';
            }

            const stats = seriesObject.get('stats');
            if (stats) {
                this.formattedMinY = seriesObject.formatY(stats.minPoint);
                this.formattedMaxY = seriesObject.formatY(stats.maxPoint);
            } else {
                this.formattedMinY = '';
                this.formattedMaxY = '';
            }
        }
    }
};
</script>
