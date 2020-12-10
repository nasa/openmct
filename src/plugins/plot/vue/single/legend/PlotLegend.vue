<template>
<div class="c-plot-legend gl-plot-legend"
     :class="{
         'hover-on-plot': !!highlights.length,
         'is-legend-hidden': isLegendHidden
     }"
>
    <div class="c-plot-legend__view-control gl-plot-legend__view-control c-disclosure-triangle is-enabled"
         :class="{ 'c-disclosure-triangle--expanded': isLegendExpanded }"
         @click="expandLegend"
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
            <plot-legend-item-collapsed v-for="seriesObject in series"
                                        :key="seriesObject.keyString"
                                        :highlights="highlights"
                                        :value-to-show-when-collapsed="legend.get('valueToShowWhenCollapsed')"
                                        :series-object="seriesObject"
                                        :closest="seriesObject.closest"
            />
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
                        <th v-if="showTimestampWhenExpanded">
                            Timestamp
                        </th>
                        <th v-if="showValueWhenExpanded">
                            Value
                        </th>
                        <th v-if="showUnitsWhenExpanded">
                            Unit
                        </th>
                        <th v-if="showMinimumWhenExpanded"
                            class="mobile-hide"
                        >
                            Min
                        </th>
                        <th v-if="showMaximumWhenExpanded"
                            class="mobile-hide"
                        >
                            Max
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <plot-legend-item-expanded v-for="seriesObject in series"
                                               :key="seriesObject.keyString"
                                               :series-object="seriesObject"
                                               :highlights="highlights"
                                               :legend="legend"
                    />
                </tbody>
            </table>
        </div>
    </div>
</div>
</template>
<script>
import PlotLegendItemCollapsed from "./PlotLegendItemCollapsed.vue";
import PlotLegendItemExpanded from "./PlotLegendItemExpanded.vue";
export default {
    inject: ['openmct', 'domainObject'],
    components: {
        PlotLegendItemExpanded,
        PlotLegendItemCollapsed
    },
    props: {
        cursorLocked: {
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
        highlights: {
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
            isLegendHidden: this.legend.get('hideLegendWhenSmall') !== true,
            isLegendExpanded: this.legend.get('expanded') === true,
            showTimestampWhenExpanded: this.legend.get('showTimestampWhenExpanded') === true,
            showValueWhenExpanded: this.legend.get('showValueWhenExpanded') === true,
            showUnitsWhenExpanded: this.legend.get('showUnitsWhenExpanded') === true,
            showMinimumWhenExpanded: this.legend.get('showMinimumWhenExpanded') === true,
            showMaximumWhenExpanded: this.legend.get('showMaximumWhenExpanded') === true
        };
    },
    methods: {
        expandLegend() {
            this.isLegendExpanded = !this.isLegendExpanded;
            this.legend.set('expanded', this.isLegendExpanded);
        }
    }
};

</script>
