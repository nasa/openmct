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
        <!-- <table-header
            v-for="(title, key, headerIndex) in headers"
            :key="key"
            :header-key="key"
            :header-index="headerIndex"
            :column-width="columnWidths[key]"
            :sort-options="sortOptions"
            :is-editing="isEditing"
        >
            <span class="c-telemetry-table__headers__label">{{ title }}</span>
            <table-header />
        </table-header> -->
    </thead>
    <template
        v-for="ladTable in ladTableObjects"
    >
        <!-- Header rows goes here -->
        <tbody
            :key="ladTable.key"
        >
            <!-- subheder for each table -->
            <tr
                :key="ladTable.key"
                class="c-table__group-header js-lad-table-set__table-headers"
            >
                <td colspan="10">
                    {{ ladTable.domainObject.name }}
                </td>
            </tr>
            <!-- rows of each table -->
            <!-- <table-row
                v-for="(ladTelemetry, ladIndex) in ladTelemetryObjects"
                :key="ladIndex"
                :headers="headers"
                :column-widths="columnWidths"
                :row-index="ladIndex"
                :object-path="objectPath"
                :row-offset="rowOffset"
                :row-height="rowHeight"
                :row="ladTelemetry"
                :marked="ladTelemetry.marked"
            /> -->
        </tbody>
    </template>
</table>
</template>

<script>
// import TableRow from '/src/plugins/telemetryTable/components/table-row.vue';
import LADTable from '../LADTable';
// import TableHeader from '/src/plugins/telemetryTable/components/table-column-header.vue';

// headers is an object:
// { cos: "Cosine"
// cos-unit: "Cosine Unit"
// local: "Time"
// name: "Name"
// sin: "Sine"
// sin-unit: "Sine Unit"
// state: "State"
// utc: "Time"
// value: "Value"
// yesterday: "Yesterday }

// row is a telemetry table row (comes with each LAD table)

export default {
    components: {
        // TableRow,
        // TableHeader
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
            ladTableObjects: [],
            ladTelemetryObjects: {},
            compositions: [],
            viewContext: {},
            marking: {
                disableMultiSelect: false,
                enable: true,
                rowName: '',
                rowNamePlural: '',
                useAlternateControlBar: false
            }
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
        // ladTableObjects are the tables domain object (not instance of LADTable.js yet)
        // ladTelemetryObjects are the soruce (ex: sine wave gen)
        // console.log('tables', this.ladTableObjects);
        // console.log('telemetries', this.ladTelemetryObjects);
        console.log('headers', this.ladTableObjects);
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
        // createLADTable(table) {
        //     return new LADTable(table.domainObject, this.openmct);
        // },
        addLadTable(domainObject) {
            //ladTable is an instance of LADTable.js
            let ladTable = new LADTable(domainObject, this.openmct);
            this.$set(this.ladTelemetryObjects, ladTable.keyString, []);
            this.ladTableObjects.push(ladTable);

            let composition = this.openmct.composition.get(ladTable.domainObject);
            let addCallback = this.addTelemetryObject(ladTable);
            let removeCallback = this.removeTelemetryObject(ladTable);

            composition.on('add', addCallback);
            composition.on('remove', removeCallback);
            composition.load();

            this.compositions.push({
                composition,
                addCallback,
                removeCallback
            });
        },
        removeLadTable(identifier) {
            let index = this.ladTableObjects.findIndex(ladTable => this.openmct.objects.makeKeyString(identifier) === ladTable.key);
            let ladTable = this.ladTableObjects[index];

            this.$delete(this.ladTelemetryObjects, ladTable.key);
            this.ladTableObjects.splice(index, 1);
        },
        reorderLadTables(reorderPlan) {
            let oldComposition = this.ladTableObjects.slice();
            reorderPlan.forEach(reorderEvent => {
                this.$set(this.ladTableObjects, reorderEvent.newIndex, oldComposition[reorderEvent.oldIndex]);
            });
        },
        addTelemetryObject(ladTable) {
            return (domainObject) => {
                let telemetryObject = {};
                telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
                telemetryObject.domainObject = domainObject;

                let telemetryObjects = this.ladTelemetryObjects[ladTable.keyString];
                telemetryObjects.push(telemetryObject);

                this.$set(this.ladTelemetryObjects, ladTable.key, telemetryObjects);
            };
        },
        removeTelemetryObject(ladTable) {
            return (identifier) => {
                let telemetryObjects = this.ladTelemetryObjects[ladTable.key];
                let index = telemetryObjects.findIndex(telemetryObject => this.openmct.objects.makeKeyString(identifier) === telemetryObject.key);

                telemetryObjects.splice(index, 1);

                this.$set(this.ladTelemetryObjects, ladTable.key, telemetryObjects);
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
