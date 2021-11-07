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
            <th>Name</th>
            <th>Timestamp</th>
            <th>Value</th>
            <th v-if="hasUnits">Unit</th>
        </tr>
    </thead>
    <tbody>
        <template
            v-for="tableKey in tables"
        >
            <tr
                :key="tableKey"
                class="c-table__group-header js-lad-table-set__table-headers"
            >
                <td colspan="10">
                    {{ getTableName(tableKey) }}
                </td>
            </tr>
            <LadRow
                v-for="telemetryKey in telemetry[tableKey]"
                :key="`${tableKey}${telemetryKey}`"
                :row="ladRowData[telemetryKey]"
                :telemetry-object="getTelemetryObject(tableKey, telemetryKey)"
                :headers="headers"
                :has-units="hasUnits"
                :path-to-table="getObjectPath(tableKey)"
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
            updatingView: false,
            headers: {},
            ladTables: [],
            ladTableTelemetry: {},
            ladRows: {},
            compositions: [],
            viewContext: {},
            hasUnits: false,
            tables: [],
            telemetry: {},
            ladRowData: {}
        };
    },
    computed: {
    },
    mounted() {
        setInterval(() => {
            this.updateVisibleRows();
        }, 5000);
        this.listeners = {};

        this.tableSet.on('headers-added', this.updateHeaders);
        this.tableSet.on('table-added', this.addTable);
        this.tableSet.on('table-removed', this.removeTable);

        // this.tableSet.on('telemetry-object-added', this.checkUnit);
        this.tableSet.initialize();
    },
    destroyed() {
        this.tableSet.off('headers-added', this.updateHeaders);
        this.tableSet.off('table-added', this.addTable);
        this.tableSet.off('table-removed', this.removeTable);
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
        getObjectPath(key) {
            const table = this.tableSet.tables[key];

            return [table.domainObject, ...this.objectPath];
        },
        getTelemetryObject(ladTableKey, telemetryKey) {
            const ladTable = this.tableSet.tables[ladTableKey];
            const telemetry = ladTable.telemetryObjects[telemetryKey];

            return telemetry;
        },
        getTableName(key) {
            return this.tableSet.tables[key].domainObject.name;
        },
        addTable(ladTable) {
            // const ladTableObject = {
            //     key: ladTable.keyString,
            //     name: ladTable.domainObject.name
            // };

            ladTable.on('lad-object-added', this.addTelemetry.bind(this, ladTable.keyString));
            ladTable.tableRows.on('add', this.addRow);
            ladTable.initialize();
            // this.ladTables.push(ladTable.keyString);
            this.tables.push(ladTable.keyString);
        },
        removeTable(identifier) {
            let idx;
            for (let i in this.ladTableObjects) {
                if (this.ladTableObjects[i].keyString === identifier.key) {
                    idx = i;
                    break;
                }
            }

            if (idx !== undefined) {
                this.ladTableObjects.splice(idx, 1);
            }
        },
        checkUnit() {
            for (let ladKey in this.tableSet.telemetryObjects) {
                if (ladKey) {
                    let telemetryObjects = this.tableSet.telemetryObjects[ladKey];
                    for (let teleKey in telemetryObjects) {
                        if (teleKey) {
                            let telemetryObject = telemetryObjects[teleKey];
                            let valueMetadatas = telemetryObject.metadata.valueMetadatas;
                            for (let metadatum of valueMetadatas) {
                                if (metadatum.unit !== undefined) {
                                    this.hasUnits = true;

                                    return;
                                }
                            }

                        }
                    }
                }
            }

            return this.hasUnits = false;
        },
        addTelemetry(tableKey, telemetryObject) {
            const telemetryKey = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            if (this.telemetry[tableKey] === undefined) {
                this.$set(this.telemetry, tableKey, []);
            }

            this.telemetry[tableKey].push(telemetryKey);
        },
        addRow(telemetry) {
            const ladTelemetry = telemetry[0];

            this.$set(this.ladRowData, ladTelemetry.objectKeyString, ladTelemetry);
        },
        updateVisibleRows() {
            if (!this.updatingView) {
                this.updatingView = true;
                requestAnimationFrame(() => {
                    Object.entries(this.tableSet.tables).forEach(([key, table]) => {
                        const rows = table.tableRows.getRows();

                        this.$set(this.ladTableTelemetry, key, rows);
                    });

                    this.updatingView = false;
                });
            }
        }
    }
};
</script>
