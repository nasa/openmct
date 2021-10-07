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
<table class="c-table c-lad-table">
    <thead>
        <tr>
            <th v-for="header in headers"
                :key="header"
            >
                {{ header }}
            </th>
        </tr>
    </thead>
    <tbody :key="ladRowKey">
        <template
            v-for="ladTable in ladTableObjects"
        >
            <tr
                :key="ladTable.keyString"
                class="c-table__group-header js-lad-table-set__table-headers"
            >
                <td colspan="10">
                    {{ ladTable.domainObject.name }}
                </td>
            </tr>
            <lad-row
                v-for="telemetryObject in tableSet.telemetryObjects[ladTable.keyString]"
                :key="telemetryObject.keyString"
                :telemetry-object="telemetryObject"
                :lad-table="ladTable"
                :headers="headers"
                :path-to-table="getObjectPath(ladTable)"
                @rowContextClick="updateViewContext"
            />
        </template>
    </tbody>
</table>
</template>

<script>
import LadRow from './LADRow.vue';

export default {
    components: {
        LadRow
    },
    inject: ['openmct', 'objectPath', 'currentView', 'tableSet'],
    props: {
        domainObject: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            headers: {},
            ladTableObjects: [],
            ladRows: {},
            compositions: [],
            viewContext: {},
            ladRowKey: 0
        };
    },
    computed: {
        // 1. store only the domainObject of the ladTable in LadTableSet
        //      a. can still get the headers from this.configuration by creating it
        //      eg: this.configuration = new TelemetryTableConfiguration(domainObject, openmct);
        // 2. Pass only the telemetry object from LADTable to LADRow.vue
        //      a. check loadCompoisition to get all the telemetry objects
        // 3. in LADRow.vue call the telemetry api to get the data
        //      a. check addTelemetryObject in telemetryTable
    },
    mounted() {
        // this.composition = this.openmct.composition.get(this.domainObject);
        // this.composition.on('add', this.addLadTable);
        // this.composition.on('remove', this.removeLadTable);
        // this.composition.on('reorder', this.reorderLadTables);
        // this.composition.load();

        // call this.tableSet.getHeaders for headers
        // call this.tableSet.getRows for all the rows
        this.tableSet.on('headers-added', this.updateHeaders);
        this.tableSet.on('table-added', this.addLadTable);
        this.tableSet.on('updateLadRows', this.updateLadRows);
        this.tableSet.initialize();
        // this.tableSet.on('add', this.addLadTable);

    },
    destroyed() {
        this.tableSet.off('headers-added', this.updateHeaders);
        this.tableSet.off('table-added', this.addLadTable);
        this.tableSet.off('updateLadRows', this.updateLadRows);
    },
    methods: {
        updateViewContext(rowContext) {
            this.viewContext.row = rowContext;
        },
        getViewContext() {
            return this.viewContext;
        },
        updateHeaders() {
            this.headers = this.tableSet.headers;
        },
        getObjectPath(ladTable) {
            return [ladTable.domainObject, ...this.objectPath];
        },
        addLadTable(ladTable) {
            this.ladTableObjects.push(ladTable);
        },
        updateLadRows(ladObject) {
            let key = ladObject.key;
            let ladRows = ladObject.ladRows;
            this.ladRows[key] = ladRows;
            this.$set(this.ladRows, key, ladRows);
            this.ladRowKey++;
        }
    }
};
</script>
