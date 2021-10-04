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
            <lad-row
                v-for="ladRow in ladTelemetryObjects[ladTable.keyString]"
                :key="ladRow.key"
                :domain-object="ladRow.domainObject"
                :path-to-table="ladTable.objectPath"
                @rowContextClick="updateViewContext"
            />
        </template>
    </tbody>
</table>
</template>

<script>
import LadRow from './LADRow.vue';
// 1. get headers
// 2. create needed functions in LADTableSet.js
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
            ladTelemetryObjects: {},
            compositions: [],
            viewContext: {}
        };
    },
    computed: {
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
        this.tableSet.initialize();
        // this.tableSet.on('add', this.addLadTable);

    },
    destroyed() {
        // this.composition.off('add', this.addLadTable);
        // this.composition.off('remove', this.removeLadTable);
        // this.composition.off('reorder', this.reorderLadTables);
        // this.compositions.forEach(c => {
        //     c.composition.off('add', c.addCallback);
        //     c.composition.off('remove', c.removeCallback);
        // });
    },
    methods: {
        addLadTable(domainObject) {
            let ladTable = {};
            ladTable.domainObject = domainObject;
            ladTable.keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            ladTable.objectPath = [domainObject, ...this.objectPath];

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
        },
        updateHeaders() {
            this.headers = this.tableSet.headers;
        }
    }
};
</script>
