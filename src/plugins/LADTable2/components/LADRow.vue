
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
<tr
    class="js-lad-table__body__row"
    @contextmenu.prevent="showContextMenu"
>
    <td class="js-first-data">{{ telemetryObject.telemetryObject.name }}</td>
    <td class="js-second-data">{{ formattedTimestamp }}</td>
    <td
        class="js-third-data"
        :class="valueClass"
    >{{ value }}</td>
    <td
        v-if="hasUnits"
        class="js-units"
    >
        {{ unit }}
    </td>
</tr>
</template>

<script>

export default {
    inject: ['openmct', 'currentView'],
    props: {
        row: {
            type: Object,
            required: true
        },
        telemetryObject: {
            type: Object,
            required: true
        },
        headers: {
            type: Object,
            required: true
        },
        pathToTable: {
            type: Array,
            required: true
        },
        hasUnits: {
            type: Boolean,
            require: true
        }
    },
    data() {
        return {
            rowClass: this.row.getRowClass()
        };
    },
    computed: {
        domainObject() {
            return this.telemetryObject.telemetryObject;
        },
        metadata() {
            return this.openmct.telemetry.getMetadata(this.domainObject);
        },
        formats() {
            return this.openmct.telemetry.getFormatMap(this.metadata);
        },
        limitEvaluator() {
            return this.openmct.telemetry.limitEvaluator(this.domainObject);
        },
        valueMetadata() {
            return this.metadata
                ? this.metadata.valuesForHints(['range'])[0]
                : undefined;
        },
        valueKey() {
            return this.valueMetadata
                ? this.valueMetadata.key
                : undefined;
        },
        value() {
            let formatter = this.formats && this.formats[this.valueKey];
            if (formatter && formatter.format(this.row.datum) !== 'nan') {
                return formatter.format(this.row.datum);
            } else {
                return '---';
            }
        },
        headerKeys() {
            return Object.keys(this.headers);
        },
        formattedTimestamp() {
            return this.timestamp !== undefined ? this.getFormattedTimestamp(this.timestamp) : '---';
        },
        timestamp() {
            return this.row.datum[this.timeSystemKey];
        },
        valueClass() {
            return '';

            let limit;
            if (this.limitEvaluator) {
                limit = this.limitEvaluator.evaluate(this.row, this.valueMetadata);
            }

            if (limit) {
                return limit.cssClass;
            } else {
                return '';
            }
        },
        unit() {
            return this.valueMetadata.unit || '';
        }
    },
    mounted() {
        this.openmct.time.on('timeSystem', this.updateTimeSystem);
        this.timeSystemKey = this.openmct.time.timeSystem().key;
    },
    destroyed() {
        this.openmct.time.off('timeSystem', this.updateTimeSystem);
    },
    methods: {
        parseValue(header) {
            if (this.row[header] === undefined) {
                return '--';
            } else {
                return this.row[header];
            }
        },
        updateViewContext() {
            this.$emit('rowContextClick', {
                viewHistoricalData: true,
                viewDatumAction: true,
                getDatum: () => {
                    return this.datum;
                }
            });
        },
        getParsedTimestamp(timestamp) {
            if (this.timeSystemFormat()) {
                return this.formats[this.timeSystemKey].parse(timestamp);
            }
        },
        getFormattedTimestamp(timestamp) {
            if (this.timeSystemFormat()) {
                return this.formats[this.timeSystemKey].format(timestamp);
            }
        },
        timeSystemFormat() {
            if (this.formats && this.formats[this.timeSystemKey]) {
                return true;
            } else {
                console.warn(`No formatter for ${this.timeSystemKey} time system for ${this.domainObject.name}.`);

                return false;
            }
        },
        updateTimeSystem(timeSystem) {
            this.timeSystemKey = timeSystem.key;
        }
    }
};
</script>

