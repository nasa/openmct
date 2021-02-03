<template>
<div>
    <div class="c-tree__item menus-to-left">
        <span class="c-disclosure-triangle is-enabled flex-elem"
              :class="{ 'c-disclosure-triangle--expanded': series.expanded }"
              @click="toggleExpanded"
        >
        </span>
        <div class="c-object-label"
             :class="{ 'is-status--missing': series.oldObject.model.status === 'missing' }"
        >
            <div class="c-object-label__type-icon {{series.oldObject.type.getCssClass()}}"
                 :class="{ 'l-icon-link':series.oldObject.location.isLink() }"
            >
                <span class="is-status__indicator"
                      title="This item is missing or suspect"
                ></span>
            </div>
            <div class="c-object-label__name">{{ series.oldObject.model.name }}</div>
        </div>
    </div>
    <ul v-show="series.expanded"
        class="grid-properties"
    >
        <li class="grid-row">
            <div class="grid-cell label"
                 title="The field to be plotted as a value for this series."
            >Value</div>
            <div class="grid-cell value">
                {{ series.get('yKey') }}
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="The rendering method to join lines for this series."
            >Line Method</div>
            <div class="grid-cell value">{{ {
                'none': 'None',
                'linear': 'Linear interpolation',
                'stepAfter': 'Step After'
            }[series.get('interpolate')] }}
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Whether markers are displayed, and their size."
            >Markers</div>
            <div class="grid-cell value">
                {{ series.markerOptionsDisplayText() }}
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Display markers visually denoting points in alarm."
            >Alarm Markers</div>
            <div class="grid-cell value">
                {{ series.get('alarmMarkers') ? "Enabled" : "Disabled" }}
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="The plot line and marker color for this series."
            >Color</div>
            <div class="grid-cell value">
                <span class="c-color-swatch"
                      :style="{
                          'background': series.get('color').asHexString()
                      }"
                >
                </span>
            </div>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: [],
    props: {
        series: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    methods: {
        toggleExpanded() {
            this.series.expanded = !this.series.expanded;
        }
    }
};
</script>
