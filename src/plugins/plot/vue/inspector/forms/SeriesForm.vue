<template>
<div>
    <div class="c-tree__item menus-to-left">
        <span :class="{ disclosureTriangleCss }"
              @click="toggleExpanded"
        >
        </span>
        <div :class="{ objectLabelCss }">
            <div :class="{ linkCss }">
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
                <select :v-model="yKey"
                        @change="updateForm('yKey')"
                >
                    <option v-for="option in yKeyOptions"
                            :key="option.value"
                            :value="option.value"
                            :selected="option.value == yKey"
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
                <select v-model="interpolate">
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
                <input v-model="markers"
                       type="checkbox"
                >
                <select
                    v-show="markers"
                    v-model="markerShape"
                >
                    <option
                        v-for="option in markerShapeOptions"
                        :key="option.value"
                        :value="option.value"
                        :selected="option.value == markerShape"
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
                <input v-model="alarmMarkers"
                       type="checkbox"
                >
            </div>
        </li>
        <li v-show="markers || alarmMarkers"
            class="grid-row"
        >
            <div class="grid-cell label"
                 title="The size of regular and alarm markers for this series."
            >Marker Size:</div>
            <div class="grid-cell value"><input v-model="markerSize"
                                                class="c-input--flex"
                                                type="text"
            ></div>
        </li>
        <!-- Use the swatch component here instead -->
        <!--        <li class="grid-row"-->
        <!--            ng-controller="ClickAwayController as toggle"-->
        <!--            ng-show="interpolate !== 'none' || markers"-->
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
import { MARKER_SHAPES } from "../../single/draw/MarkerShapes";

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        series: {
            type: Object,
            default() {
                return {};
            }
        },
        formModel: {
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
            expanded: false,
            model: {},
            markerShapeOptions: [],
            yKey: '',
            interpolate: '',
            markers: '',
            markerShape: '',
            alarmMarkers: '',
            markerSize: ''
        };
    },
    computed: {
        objectLabelCss() {
            return this.series.oldObject.model.status === 'missing' ? 'c-object-label is-status--missing' : 'c-object-label';
        },
        seriesCss() {
            return `c-object-label__type-icon ${this.series.oldObject.type.getCssClass()}`;
        },
        linkCss() {
            return this.series.oldObject.location.isLink() ? 'l-icon-link' : '';
        },
        disclosureTriangleCss() {
            return this.expanded ? 'c-disclosure-triangle is-enabled flex-elem c-disclosure-triangle--expanded' : 'c-disclosure-triangle is-enabled flex-elem';
        }
    },
    mounted() {
        this.initialize();
    },
    methods: {
        initialize: function () {
            this.fields = [
                {
                    modelProp: 'yKey',
                    objectPath: this.dynamicPathForKey('yKey')
                },
                {
                    modelProp: 'interpolate',
                    objectPath: this.dynamicPathForKey('interpolate')
                },
                {
                    modelProp: 'markers',
                    objectPath: this.dynamicPathForKey('markers')
                },
                {
                    modelProp: 'markerShape',
                    objectPath: this.dynamicPathForKey('markerShape')
                },
                {
                    modelProp: 'markerSize',
                    coerce: Number,
                    objectPath: this.dynamicPathForKey('markerSize')
                },
                {
                    modelProp: 'alarmMarkers',
                    coerce: Boolean,
                    objectPath: this.dynamicPathForKey('alarmMarkers')
                }
            ];

            const metadata = this.model.metadata;
            this.yKeyOptions = metadata
                .valuesForHints(['range'])
                .map(function (o) {
                    return {
                        name: o.key,
                        value: o.key
                    };
                });
            this.markerShapeOptions = Object.entries(MARKER_SHAPES)
                .map(([key, obj]) => {
                    return {
                        name: obj.label,
                        value: key
                    };
                });
        },
        dynamicPathForKey(key) {
            return function (object, model) {
                const modelIdentifier = model.get('identifier');
                const index = object.configuration.series.findIndex(s => {
                    return _.isEqual(s.identifier, modelIdentifier);
                });

                return 'configuration.series[' + index + '].' + key;
            };
        },
        /**
       * Set the color for the current plot series.  If the new color was
       * already assigned to a different plot series, then swap the colors.
       */
        setColor: function (color) {
            const oldColor = this.model.get('color');
            const otherSeriesWithColor = this.model.collection.filter(function (s) {
                return s.get('color') === color;
            })[0];

            this.model.set('color', color);

            const getPath = this.dynamicPathForKey('color');
            const seriesColorPath = getPath(this.domainObject, this.model);

            this.openmct.objects.mutate(
                this.domainObject,
                seriesColorPath,
                color.asHexString()
            );

            if (otherSeriesWithColor) {
                otherSeriesWithColor.set('color', oldColor);

                const otherSeriesColorPath = getPath(
                    this.domainObject,
                    otherSeriesWithColor
                );

                this.openmct.objects.mutate(
                    this.domainObject,
                    otherSeriesColorPath,
                    oldColor.asHexString()
                );
            }
        },
        toggleExpanded() {
            this.expanded = !this.expanded;
        }
    }
};

</script>
