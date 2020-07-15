/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<layout-frame
    :item="item"
    :grid-size="gridSize"
    :is-editing="isEditing"
    @move="(gridDelta) => $emit('move', gridDelta)"
    @endMove="() => $emit('endMove')"
>
    <div
        v-if="domainObject"
        class="c-telemetry-view"
        :class="{
            styleClass,
            'is-missing': domainObject.status === 'missing'
        }"
        :style="styleObject"
        @contextmenu.prevent="showContextMenu"
    >
        <div class="is-missing__indicator"
             title="This item is missing"
        ></div>
        <div
            v-if="showLabel"
            class="c-telemetry-view__label"
        >
            <div class="c-telemetry-view__label-text">
                {{ domainObject.name }}
            </div>
        </div>

        <div
            v-if="showValue"
            :title="fieldName"
            class="c-telemetry-view__value"
            :class="[telemetryClass]"
        >
            <div class="c-telemetry-view__value-text">
                {{ telemetryValue }}
                <span
                    v-if="unit && item.showUnits"
                    class="c-telemetry-view__value-text__unit"
                >
                    {{ unit }}
                </span>
            </div>
        </div>
    </div>
</layout-frame>
</template>

<script>
import LayoutFrame from './LayoutFrame.vue'
import printj from 'printj'
import conditionalStylesMixin from "../mixins/objectStyles-mixin";

const DEFAULT_TELEMETRY_DIMENSIONS = [10, 5],
    DEFAULT_POSITION = [1, 1],
    CONTEXT_MENU_ACTIONS = ['viewHistoricalData'];

export default {
    makeDefinition(openmct, gridSize, domainObject, position) {
        let metadata = openmct.telemetry.getMetadata(domainObject);
        position = position || DEFAULT_POSITION;

        return {
            identifier: domainObject.identifier,
            x: position[0],
            y: position[1],
            width: DEFAULT_TELEMETRY_DIMENSIONS[0],
            height: DEFAULT_TELEMETRY_DIMENSIONS[1],
            displayMode: 'all',
            value: metadata.getDefaultDisplayValue(),
            stroke: "",
            fill: "",
            color: "",
            size: "13px"
        };
    },
    inject: ['openmct', 'objectPath'],
    components: {
        LayoutFrame
    },
    mixins: [conditionalStylesMixin],
    props: {
        item: {
            type: Object,
            required: true
        },
        gridSize: {
            type: Array,
            required: true,
            validator: (arr) => arr && arr.length === 2
                && arr.every(el => typeof el === 'number')
        },
        initSelect: Boolean,
        index: {
            type: Number,
            required: true
        },
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            datum: undefined,
            formats: undefined,
            domainObject: undefined,
            currentObjectPath: undefined
        }
    },
    computed: {
        showLabel() {
            let displayMode = this.item.displayMode;
            return displayMode === 'all' || displayMode === 'label';
        },
        showValue() {
            let displayMode = this.item.displayMode;
            return displayMode === 'all' || displayMode === 'value';
        },
        unit() {
            let value = this.item.value,
                unit = this.metadata.value(value).unit;
            return unit;
        },
        styleObject() {
            return Object.assign({}, {
                fontSize: this.item.size
            }, this.itemStyle);

        },
        fieldName() {
            return this.valueMetadata && this.valueMetadata.name;
        },
        valueMetadata() {
            return this.datum && this.metadata.value(this.item.value);
        },
        valueFormatter() {
            return this.formats[this.item.value];
        },
        telemetryValue() {
            if (!this.datum) {
                return;
            }

            if (this.item.format) {
                return printj.sprintf(this.item.format, this.datum[this.valueMetadata.key]);
            }

            return this.valueFormatter && this.valueFormatter.format(this.datum);
        },
        telemetryClass() {
            if (!this.datum) {
                return;
            }

            let alarm = this.limitEvaluator && this.limitEvaluator.evaluate(this.datum, this.valueMetadata);
            return alarm && alarm.cssClass;
        }
    },
    watch: {
        index(newIndex) {
            if (!this.context) {
                return;
            }

            this.context.index = newIndex;
        },
        item(newItem) {
            if (!this.context) {
                return;
            }

            this.context.layoutItem = newItem;
        }
    },
    mounted() {
        this.openmct.objects.get(this.item.identifier)
            .then(this.setObject);
        this.openmct.time.on("bounds", this.refreshData);
    },
    destroyed() {
        this.removeSubscription();

        if (this.removeSelectable) {
            this.removeSelectable();
        }

        this.openmct.time.off("bounds", this.refreshData);
    },
    methods: {
        requestHistoricalData() {
            let bounds = this.openmct.time.bounds();
            let options = {
                start: bounds.start,
                end: bounds.end,
                size: 1,
                strategy: 'latest'
            };
            this.openmct.telemetry.request(this.domainObject, options)
                .then(data => {
                    if (data.length > 0) {
                        this.updateView(data[data.length - 1]);
                    }
                });
        },
        subscribeToObject() {
            this.subscription = this.openmct.telemetry.subscribe(this.domainObject, function (datum) {
                if (this.openmct.time.clock() !== undefined) {
                    this.updateView(datum);
                }
            }.bind(this));
        },
        updateView(datum) {
            this.datum = datum;
        },
        removeSubscription() {
            if (this.subscription) {
                this.subscription();
                this.subscription = undefined;
            }
        },
        refreshData(bounds, isTick) {
            if (!isTick) {
                this.datum = undefined;
                this.requestHistoricalData(this.domainObject);
            }
        },
        setObject(domainObject) {
            this.domainObject = domainObject;
            this.keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
            this.limitEvaluator = this.openmct.telemetry.limitEvaluator(this.domainObject);
            this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
            this.requestHistoricalData();
            this.subscribeToObject();

            this.currentObjectPath = this.objectPath.slice();
            this.currentObjectPath.unshift(this.domainObject);

            this.context = {
                item: domainObject,
                layoutItem: this.item,
                index: this.index,
                updateTelemetryFormat: this.updateTelemetryFormat,
                toggleUnits: this.toggleUnits,
                showUnits: this.showUnits
            };
            this.removeSelectable = this.openmct.selection.selectable(
                this.$el, this.context, this.immediatelySelect || this.initSelect);
            delete this.immediatelySelect;
        },
        updateTelemetryFormat(format) {
            this.$emit('formatChanged', this.item, format);
        },
        showContextMenu(event) {
            this.openmct.contextMenu._showContextMenuForObjectPath(this.currentObjectPath, event.x, event.y, CONTEXT_MENU_ACTIONS);
        }
    }
}

</script>
