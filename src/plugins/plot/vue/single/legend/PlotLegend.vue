<template>
<div v-if="series.length > 0"
     class="c-plot-legend gl-plot-legend"
     :class="{
         'hover-on-plot': showHighlights,
         'is-legend-hidden': legend.get('hideLegendWhenSmall')
     }"
>
    <div class="c-plot-legend__view-control gl-plot-legend__view-control c-disclosure-triangle is-enabled"
         :class="{ 'c-disclosure-triangle--expanded': legend.get('expanded') }"
         @click="legend.set('expanded', !legend.get('expanded'));"
    >
    </div>

    <div class="c-plot-legend__wrapper"
         :class="{ 'is-cursor-locked': cursorLocked }"
    >

        <!-- COLLAPSED PLOT LEGEND -->
        <div class="plot-wrapper-collapsed-legend"
             :class="{'is-cursor-locked': cursorLocked }"
        >
            <div class="c-state-indicator__alert-cursor-lock icon-cursor-lock"
                 title="Cursor is point locked. Click anywhere in the plot to unlock."
            ></div>
            <div v-for="(seriesObject, index) in series"
                 :key="index"
                 class="plot-legend-item"
                 :class="{
                     'is-status--missing': seriesObject.domainObject.status === 'missing'
                 }"
            >
                <div class="plot-series-swatch-and-name">
                    <span class="plot-series-color-swatch"
                          :style="{ 'background-color': seriesObject.get('color').asHexString() }"
                    >
                    </span>
                    <span class="is-status__indicator"
                          title="This item is missing or suspect"
                    ></span>
                    <span class="plot-series-name">{{ seriesObject.nameWithUnit() }}</span>
                </div>
                <!--seriesObject.closest.mctLimitState.cssClass , value-to-display-{{ legend.get('valueToShowWhenCollapsed') }}-->
                <div v-show="showHighlights && legend.get('valueToShowWhenCollapsed') !== 'none'"
                     class="plot-series-value hover-value-enabled"
                     :class="{ 'cursor-hover': (legend.get('valueToShowWhenCollapsed').indexOf('nearest') != -1) }"
                >
                    {{ legend.get('valueToShowWhenCollapsed') === 'nearestValue' ?
                        seriesObject.formatY(seriesObject.closest) :
                        legend.get('valueToShowWhenCollapsed') === 'nearestTimestamp' ?
                            seriesObject.closest && seriesObject.formatX(seriesObject.closest) :
                            seriesObject.formatY(seriesObject.get('stats')[legend.get('valueToShowWhenCollapsed') + 'Point'])
                    }}
                </div>
            </div>
        </div>
        <!-- EXPANDED PLOT LEGEND -->
        <div class="plot-wrapper-expanded-legend"
             :class="{'is-cursor-locked': cursorLocked }"
        >
            <div class="c-state-indicator__alert-cursor-lock--verbose icon-cursor-lock"
                 title="Click anywhere in the plot to unlock."
            > Cursor locked to point</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th v-if="legend.get('showTimestampWhenExpanded')">
                            Timestamp
                        </th>
                        <th v-if="legend.get('showValueWhenExpanded')">
                            Value
                        </th>
                        <th v-if="legend.get('showUnitsWhenExpanded')">
                            Unit
                        </th>
                        <th v-if="legend.get('showMinimumWhenExpanded')"
                            class="mobile-hide"
                        >
                            Min
                        </th>
                        <th v-if="legend.get('showMaximumWhenExpanded')"
                            class="mobile-hide"
                        >
                            Max
                        </th>
                    </tr>
                </thead>
                <tbody v-if="loaded">
                    <tr v-for="(seriesObject, index) in series"
                        :key="index"
                        class="plot-legend-item"
                        :class="{
                            'is-status--missing': seriesObject.domainObject.status === 'missing'
                        }"
                    >
                        <td class="plot-series-swatch-and-name">
                            <span class="plot-series-color-swatch"
                                  :style="{ 'background-color': seriesObject.get('color').asHexString() }"
                            >
                            </span>
                            <span class="is-status__indicator"
                                  title="This item is missing or suspect"
                            ></span>
                            <span class="plot-series-name">{{ seriesObject.get('name') }}</span>
                        </td>

                        <td v-if="legend.get('showTimestampWhenExpanded')">
                            <span class="plot-series-value cursor-hover hover-value-enabled">
                                {{ seriesObject.closest && seriesObject.formatX(seriesObject.closest) }}
                            </span>
                        </td>
                        <td v-if="legend.get('showValueWhenExpanded')">
                            <!-- :class="series.closest.mctLimitState.cssClass" -->
                            <span class="plot-series-value cursor-hover hover-value-enabled">
                                {{ seriesObject.formatY(seriesObject.closest) }}
                            </span>
                        </td>
                        <td v-if="legend.get('showUnitsWhenExpanded')">
                            <span class="plot-series-value cursor-hover hover-value-enabled">
                                {{ seriesObject.get('unit') }}
                            </span>
                        </td>
                        <td v-if="legend.get('showMinimumWhenExpanded')"
                            class="mobile-hide"
                        >
                            <span class="plot-series-value">
                                {{ seriesObject.formatY(seriesObject.get('stats').minPoint) }}
                            </span>
                        </td>
                        <td v-if="legend.get('showMaximumWhenExpanded')"
                            class="mobile-hide"
                        >
                            <span class="plot-series-value">
                                {{ seriesObject.formatY(seriesObject.get('stats').maxPoint) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
</template>
<script>

export default {
    props: {
        cursorLocked: {
            type: Boolean,
            default() {
                return false;
            }
        },
        showHighlights: {
            type: Boolean,
            default() {
                return false;
            }
        },
        series: {
            type: Array,
            default() {
                return [];
            }
        },
        legend: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            loaded: false
        };
    },
    mounted() {
        this.loaded = true;
    }
};

</script>
