<!--
 Open MCT, Copyright (c) 2014-2022, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div class="c-bar-graph-options js-bar-plot-option">
    <ul class="c-tree">
        <h2 title="Display properties for this object">Bar Graph Series</h2>
        <li class="grid-row">
            <series-options
                v-for="series in plotSeries"
                :key="series.key"
                :item="series"
                :color-palette="colorPalette"
            />
        </li>
    </ul>
    <div class="grid-properties">
        <ul class="l-inspector-part">
            <h2 title="Y axis settings for this object">Axes</h2>
            <li class="grid-row">
                <div
                    class="grid-cell label"
                    title="X axis selection."
                >X Axis</div>
                <div
                    v-if="isEditing"
                    class="grid-cell value"
                >
                    <select
                        v-model="xKey"
                        @change="updateForm('xKey')"
                    >
                        <option
                            v-for="option in xKeyOptions"
                            :key="`xKey-${option.value}`"
                            :value="option.value"
                            :selected="option.value === xKey"
                        >
                            {{ option.name }}
                        </option>
                    </select>
                </div>
                <div
                    v-else
                    class="grid-cell value"
                >{{ xKeyLabel }}</div>
            </li>
            <li class="grid-row">
                <div
                    class="grid-cell label"
                    title="Y axis selection."
                >Y Axis</div>
                <div
                    v-if="isEditing"
                    class="grid-cell value"
                >
                    <select
                        v-model="yKey"
                        @change="updateForm('yKey')"
                    >
                        <option
                            v-for="option in yKeyOptions"
                            :key="`yKey-${option.value}`"
                            :value="option.value"
                            :selected="option.value === yKey"
                        >
                            {{ option.name }}
                        </option>
                    </select>
                </div>
                <div
                    v-else
                    class="grid-cell value"
                >{{ yKeyLabel }}</div>
            </li>
        </ul>
    </div>
    <div class="grid-properties">
        <ul class="l-inspector-part">
            <h2 title="Use time-based interpolation for telemetry">Line Method</h2>
            <li class="grid-row">
                <div
                    v-if="isEditing"
                    class="grid-cell label"
                    title="The rendering method to join lines for this series."
                >Line Method</div>
                <div
                    v-if="isEditing"
                    class="grid-cell value"
                >
                    <select
                        v-model="useInterpolation"
                        @change="updateInterpolation"
                    >
                        <option value="none">None</option>
                        <option value="linear">Linear interpolate</option>
                        <option value="hv">Step after</option>
                    </select>
                </div>
                <div
                    v-if="!isEditing"
                    class="grid-cell label"
                    title="The rendering method to join lines for this series."
                >Line Method</div>
                <div
                    v-if="!isEditing"
                    class="grid-cell value"
                >{{ {
                    'none': 'None',
                    'linear': 'Linear interpolation',
                    'hv': 'Step After'
                }[useInterpolation] }}
                </div>
            </li>
        </ul>
        <ul class="l-inspector-part">
            <h2 title="Use time-based interpolation for telemetry">Bars</h2>
            <li class="grid-row">
                <label
                    v-if="isEditing"
                    class="c-toggle-switch"
                >
                    <input
                        type="checkbox"
                        :checked="useBar"
                        @change="updateBar"
                    >
                    <span class="c-toggle-switch__slider"></span>
                    <span class="c-toggle-switch__label">Show Bars</span>
                </label>
                <span
                    v-if="!isEditing"
                    class="c-toggle-switch__label grid-cell label"
                >Show bars:</span>
                <span
                    v-if="!isEditing"
                    class="grid-cell value"
                >{{ useBar ? 'Yes' : 'No' }}</span>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import SeriesOptions from "./SeriesOptions.vue";
import ColorPalette from '@/ui/color/ColorPalette';

export default {
    components: {
        SeriesOptions
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            xKey: undefined,
            yKey: undefined,
            xKeyLabel: '',
            yKeyLabel: '',
            plotSeries: [],
            yKeyOptions: [],
            xKeyOptions: [],
            isEditing: this.openmct.editor.isEditing(),
            colorPalette: this.colorPalette,
            useInterpolation: this.domainObject.configuration.useInterpolation,
            useBar: this.domainObject.configuration.useBar === true
        };
    },
    computed: {
        canEdit() {
            return this.isEditing && !this.domainObject.locked;
        }
    },
    beforeMount() {
        this.colorPalette = new ColorPalette();
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.setEditState);
        this.composition = this.openmct.composition.get(this.domainObject);
        this.registerListeners();
        this.composition.load();
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
        this.stopListening();
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        registerListeners() {
            this.composition.on('add', this.addSeries);
            this.composition.on('remove', this.removeSeries);
            this.unobserve = this.openmct.objects.observe(this.domainObject, 'configuration.axes', this.setupOptions);
        },
        stopListening() {
            this.composition.off('add', this.addSeries);
            this.composition.off('remove', this.removeSeries);
            if (this.unobserve) {
                this.unobserve();
            }
        },
        addSeries(series, index) {
            this.$set(this.plotSeries, this.plotSeries.length, series);
            this.setupOptions();
        },
        removeSeries(series) {
            const index = this.plotSeries.find(plotSeries => this.openmct.objects.areIdsEqual(series.identifier, plotSeries.identifier));
            if (index !== undefined) {
                this.$delete(this.plotSeries, index);
                this.setupOptions();
            }
        },
        setupOptions() {
            this.xKeyOptions = [];
            this.yKeyOptions = [];
            if (this.plotSeries.length <= 0) {
                return;
            }

            let update = false;
            const series = this.plotSeries[0];
            const metadataValues = this.openmct.telemetry.getMetadata(series).valuesForHints(['range']);
            metadataValues.forEach((metadataValue) => {
                this.xKeyOptions.push({
                    name: metadataValue.name || metadataValue.key,
                    value: metadataValue.source || metadataValue.key,
                    isArrayValue: metadataValue.isArrayValue
                });
                this.yKeyOptions.push({
                    name: metadataValue.name || metadataValue.key,
                    value: metadataValue.source || metadataValue.key,
                    isArrayValue: metadataValue.isArrayValue
                });
            });

            let xKeyOptionIndex;
            let yKeyOptionIndex;

            if (this.domainObject.configuration.axes.xKey) {
                xKeyOptionIndex = this.xKeyOptions.findIndex(option => option.value === this.domainObject.configuration.axes.xKey);
                if (xKeyOptionIndex > -1) {
                    this.xKey = this.xKeyOptions[xKeyOptionIndex].value;
                    this.xKeyLabel = this.xKeyOptions[xKeyOptionIndex].name;
                }
            } else {
                if (this.xKey === undefined) {
                    update = true;
                    xKeyOptionIndex = 0;
                    this.xKey = this.xKeyOptions[xKeyOptionIndex].value;
                    this.xKeyLabel = this.xKeyOptions[xKeyOptionIndex].name;
                }
            }

            if (metadataValues.length > 1) {
                if (this.domainObject.configuration.axes.yKey) {
                    yKeyOptionIndex = this.yKeyOptions.findIndex(option => option.value === this.domainObject.configuration.axes.yKey);
                    if (yKeyOptionIndex > -1 && yKeyOptionIndex !== xKeyOptionIndex) {
                        this.yKey = this.yKeyOptions[yKeyOptionIndex].value;
                        this.yKeyLabel = this.yKeyOptions[yKeyOptionIndex].name;
                    }
                } else {
                    if (this.yKey === undefined) {
                        update = true;
                        yKeyOptionIndex = this.yKeyOptions.findIndex((option, index) => index !== xKeyOptionIndex);
                        this.yKey = this.yKeyOptions[yKeyOptionIndex].value;
                        this.yKeyLabel = this.yKeyOptions[yKeyOptionIndex].name;
                    }
                }

                this.yKeyOptions = this.yKeyOptions.map((option, index) => {
                    if (index === xKeyOptionIndex) {
                        option.name = `${option.name} (swap)`;
                        option.swap = yKeyOptionIndex;
                    } else {
                        option.name = option.name.replace(' (swap)', '');
                        option.swap = undefined;
                    }

                    return option;
                });
            }

            this.xKeyOptions = this.xKeyOptions.map((option, index) => {
                if (index === yKeyOptionIndex) {
                    option.name = `${option.name} (swap)`;
                    option.swap = xKeyOptionIndex;
                } else {
                    option.name = option.name.replace(' (swap)', '');
                    option.swap = undefined;
                }

                return option;
            });

            if (update === true) {
                this.saveConfiguration();
            }
        },
        updateForm(property) {
            //TODO: Handle xKey and yKey not being arrays
            if (property === 'xKey') {
                const xKeyOption = this.xKeyOptions.find(option => option.value === this.xKey);
                if (xKeyOption.swap !== undefined) {
                    //swap
                    this.yKey = this.xKeyOptions[xKeyOption.swap].value;
                }
            } else if (property === 'yKey') {
                const yKeyOption = this.yKeyOptions.find(option => option.value === this.yKey);
                if (yKeyOption.swap !== undefined) {
                    //swap
                    this.xKey = this.yKeyOptions[yKeyOption.swap].value;
                }
            }

            this.saveConfiguration();
        },
        saveConfiguration() {
            this.openmct.objects.mutate(this.domainObject, `configuration.axes`, {
                xKey: this.xKey,
                yKey: this.yKey
            });
        },
        updateInterpolation(event) {
            this.openmct.objects.mutate(this.domainObject, `configuration.useInterpolation`, this.useInterpolation);
        },
        updateBar(event) {
            this.useBar = event.target.checked === true;
            this.openmct.objects.mutate(this.domainObject, `configuration.useBar`, this.useBar === true);
        }
    }
};
</script>
