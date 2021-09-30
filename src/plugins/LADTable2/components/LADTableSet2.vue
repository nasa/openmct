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
            <th
                v-for="(header, idx) in headers"
                :key="idx"
            >
                {{ header }}
            </th>
        </tr>
    </thead>
    <tbody>
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
            <!-- <lad-row
                v-for="ladRow in ladTelemetryObjects[ladTable.keyString]"
                :key="ladRow.key"
                :headers="headers"
                :domain-object="ladRow.domainObject"
                :path-to-table="ladTable.objectPath"
                @rowContextClick="updateViewContext"
            /> -->
        </template>
    </tbody>
</table>
</template>

<script>
// import LadRow from './LADRow.vue';
import LADTable from '../LADTable';

// header format:
// cos: "Cosine"
// cos-unit: "Cosine Unit"
// local: "Time"
// name: "Name"
// sin: "Sine"
// sin-unit: "Sine Unit"
// state: "State"
// utc: "Time"
// value: "Value"

export default {
    components: {
        // LadRow
    },
    inject: ['openmct', 'objectPath', 'currentView'],
    props: {
        domainObject: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            headers: {},
            ladTableObjects: {},
            ladTelemetryRows: {},
            ladTelemetryObjects: {},
            compositions: [],
            viewContext: {}
        };
    },
    computed: {
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addLadTable);
        this.composition.on('remove', this.removeLadTable);
        this.composition.on('reorder', this.reorderLadTables);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.addLadTable);
        this.composition.off('remove', this.removeLadTable);
        this.composition.off('reorder', this.reorderLadTables);
        this.compositions.forEach(c => {
            c.composition.off('add', c.addCallback);
            c.composition.off('remove', c.removeCallback);
        });
    },
    methods: {
        addLadTable(domainObject) {
            // save ladtables as keyString: ladTable in ladTableObjects
            let ladKey = domainObject.identifier.key;
            if (!this.ladTableObjects[ladKey]) {
                this.ladTableObjects[ladKey] = new LADTable(domainObject, this.openmct);
                // console.log(this.ladTableObjects[ladKey]);
            }

            // let ladTable = new LADTable(domainObject, this.openmct);
            // ladTable.initialize();
            // ladTable.objectPath = [domainObject, ...this.objectPath];
            // when adding telemetry points to table
            // ladTable.tableRows.on('add', this.rowsAdded);
            // ladTable.tableRows.on('remove', this.rowsRemoved);

            this.ladTableObjects[ladKey].initialize();
            this.ladTableObjects[ladKey].objectPath = [domainObject, ...this.objectPath];
            this.ladTableObjects[ladKey].tableRows.on('add', this.rowsAdded);
            this.ladTableObjects[ladKey].tableRows.on('remove', this.rowsRemoved);

            this.$set(this.ladTelemetryObjects, this.ladTableObjects[ladKey].keyString, []);
            this.$set(this.ladTelemetryRows, this.ladTableObjects[ladKey].keyString, []);
            // this.ladTableObjects.push(ladTable);
            // when adding tables to table set
            let composition = this.openmct.composition.get(this.ladTableObjects[ladKey].domainObject);
            let addCallback = this.addTelemetryObject(this.ladTableObjects[ladKey]);
            let removeCallback = this.removeTelemetryObject(this.ladTableObjects[ladKey]);

            composition.on('add', addCallback);
            composition.on('remove', removeCallback);
            composition.load();
            this.compositions.push({
                composition,
                addCallback,
                removeCallback
            });
            this.updateHeaders();
        },
        updateHeaders() {
            for (let ladKey in this.ladTableObjects) {
                if (this.ladTableObjects[ladKey]) {
                    let lad = this.ladTableObjects[ladKey];
                    lad.configuration.getVisibleHeaders();
                }
            }
            // this.headers = ladTable.configuration.getVisibleHeaders();
        },
        removeLadTable(identifier) {
            let index = this.ladTableObjects.findIndex(ladTable => this.openmct.objects.makeKeyString(identifier) === ladTable.keyString);
            let ladTable = this.ladTableObjects[index];

            this.$delete(this.ladTelemetryObjects, ladTable.keyString);
            this.ladTableObjects.splice(index, 1);
        },
        reorderLadTables(reorderPlan) {
            let oldComposition = this.ladTableObjects.slice();
            reorderPlan.forEach(reorderEvent => {
                this.$set(this.ladTableObjects, reorderEvent.newIndex, oldComposition[reorderEvent.oldIndex]);
            });
        },
        rowsAdded(rows) {
            // add table rows to this.telemetryRows with ladTbale key
            // console.log('rows', rows.columns);
            // this.ladTelemetryRows[ladTable.keyString] = ladTable.tableRows.getRows();
            // console.log(this.ladTelemetryRows[ladTable.keyString]);
        },
        rowsRemoved() {

        },
        addTelemetryObject(ladTable) {
            return (domainObject) => {
                let telemetryObject = {};
                telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
                telemetryObject.domainObject = domainObject;

                let telemetryObjects = this.ladTelemetryObjects[ladTable.keyString];
                telemetryObjects.push(telemetryObject);

                this.$set(this.ladTelemetryObjects, ladTable.keyString, telemetryObjects);
            };
        },
        removeTelemetryObject(ladTable) {
            return (identifier) => {
                let telemetryObjects = this.ladTelemetryObjects[ladTable.keyString];
                let index = telemetryObjects.findIndex(telemetryObject => this.openmct.objects.makeKeyString(identifier) === telemetryObject.key);

                telemetryObjects.splice(index, 1);

                this.$set(this.ladTelemetryObjects, ladTable.keyString, telemetryObjects);
            };
        },
        updateViewContext(rowContext) {
            this.viewContext.row = rowContext;
        },
        getViewContext() {
            return this.viewContext;
        }
    }
};
</script>
