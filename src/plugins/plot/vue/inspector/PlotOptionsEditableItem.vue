<template>
<div>
    <div class="c-tree__item menus-to-left">
        <span class="c-disclosure-triangle is-enabled flex-elem"
              :class="{ 'c-disclosure-triangle--expanded': expanded }"
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
    <ul v-show="expanded"
        class="grid-properties"
    >
        <li class="grid-row">
            <!-- Value to be displayed -->
            <div class="grid-cell label"
                 title="The field to be plotted as a value for this series."
            >Value</div>
            <div class="grid-cell value">
                <select v-model="form.yKey">
                    <option v-for="option in yKeyOptions"
                            :key="option.value"
                            value="{{option.value}}"
                            :selected="option.value == form.yKey"
                    >
                        {{ option.name }}
                    </option>
                </select>
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="The rendering method to join lines for this series."
            >Line Method</div>
            <div class="grid-cell value">
                <select v-model="form.interpolate">
                    <option value="none">None</option>
                    <option value="linear">Linear interpolate</option>
                    <option value="stepAfter">Step after</option>
                </select>
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Whether markers are displayed."
            >Markers</div>
            <div class="grid-cell value">
                <input v-model="form.markers"
                       type="checkbox"
                >
                <select
                    v-show="form.markers"
                    v-model="form.markerShape"
                >
                    <option
                        v-for="option in markerShapeOptions"
                        :key="option.value"
                        :value="option.value"
                        :selected="option.value == form.markerShape"
                    >
                        {{ option.name }}
                    </option>
                </select>
            </div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label"
                 title="Display markers visually denoting points in alarm."
            >Alarm Markers</div>
            <div class="grid-cell value">
                <input v-model="form.alarmMarkers"
                       type="checkbox"
                >
            </div>
        </li>
        <li v-show="form.markers || form.alarmMarkers"
            class="grid-row"
        >
            <div class="grid-cell label"
                 title="The size of regular and alarm markers for this series."
            >Marker Size:</div>
            <div class="grid-cell value"><input v-model="form.markerSize"
                                                class="c-input--flex"
                                                type="text"
            ></div>
        </li>
        <!--        <li class="grid-row"-->
        <!--            ng-controller="ClickAwayController as toggle"-->
        <!--            ng-show="form.interpolate !== 'none' || form.markers"-->
        <!--        >-->
        <!--            <div class="grid-cell label"-->
        <!--                 title="Manually set the plot line and marker color for this series."-->
        <!--            >Color</div>-->
        <!--            <div class="grid-cell value">-->
        <!--                <div class="c-click-swatch c-click-swatch&#45;&#45;menu"-->
        <!--                     ng-click="toggle.toggle()"-->
        <!--                >-->
        <!--                    <span class="c-color-swatch"-->
        <!--                          ng-style="{ background: series.get('color').asHexString() }"-->
        <!--                    >-->
        <!--                    </span>-->
        <!--                </div>-->
        <!--                <div class="c-palette c-palette&#45;&#45;color">-->
        <!--                    <div class="c-palette__items"-->
        <!--                         ng-show="toggle.isActive()"-->
        <!--                    >-->
        <!--                        <div class="u-contents"-->
        <!--                             ng-repeat="group in config.series.palette.groups()"-->
        <!--                        >-->
        <!--                            <div class="c-palette__item"-->
        <!--                                 ng-repeat="color in group"-->
        <!--                                 ng-class="{ 'selected': series.get('color').equalTo(color) }"-->
        <!--                                 ng-style="{ background: color.asHexString() }"-->
        <!--                                 ng-click="setColor(color)"-->
        <!--                            >-->
        <!--                            </div>-->
        <!--                        </div>-->
        <!--                    </div>-->
        <!--                </div>-->
        <!--            </div>-->
        <!--        </li>-->
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
