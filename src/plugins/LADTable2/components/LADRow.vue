
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
    <td class="js-first-data">{{ telemetryObject.domainObject.name }}</td>
    <td class="js-second-data">{{ timestamp }}</td>
    <td
        class="js-third-data"
        :class="valueClass"
    >{{ value }}</td>
</tr>
</template>

<script>

export default {
    inject: ['openmct', 'currentView'],
    props: {
        ladRow: {
            type: Object,
            required: true
        },
        headers: {
            type: Object,
            required: true
        },
        telemetryObject: {
            type: Object,
            required: true
        },
        pathToTable: {
            type: Array,
            required: true
        }

    },
    data() {
        return {
            value: '---',
            valueClass: '',
            unit: ''
        };
    },
    computed: {
        headerKeys() {
            return Object.keys(this.headers);
        },
        formattedTimestamp() {
            return this.timestamp !== undefined ? this.getFormattedTimestamp(this.timestamp) : '---';
        },
        timestamp() {
            let datum = this.ladRow.datum;

            return this.getFormattedTimestamp(datum) || '---';
        }
    },
    mounted() {
        // console.log('telemetryObject', this.telemetryObject);
        // console.log(this.ladRow);

        // update parseValue with valueMetadata (check updateValues)
        // use datum to get name value time and unit

        // this.valueMetadata = this
        //     .metadata
        //     .valuesForHints(['range'])[0];

        // this.valueKey = this.valueMetadata.key;

        this.openmct.time.on('timeSystem', this.updateTimeSystem);
        this.timestampKey = this.openmct.time.timeSystem().key;
    },
    destroyed() {
        this.openmct.time.off('timeSystem', this.updateTimeSystem);
    },
    methods: {
        parseValue(header) {
            if (this.ladRow.datum[header] === undefined) {
                return '--';
            } else {
                return this.ladRow.datum[header];
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
                return this.telemetryObject.formats[this.timestampKey].parse(timestamp);
            }
        },
        getFormattedTimestamp(timestamp) {
            if (this.timeSystemFormat()) {
                return this.telemetryObject.formats[this.timestampKey].format(timestamp);
            }
        },
        timeSystemFormat() {
            if (this.telemetryObject.formats[this.timestampKey]) {
                return true;
            } else {
                console.warn(`No formatter for ${this.timestampKey} time system for ${this.telemetryObject.domainObject.name}.`);

                return false;
            }
        },
        updateTimeSystem(timeSystem) {
            this.timestampKey = timeSystem.key;
        }
    }
};
</script>

