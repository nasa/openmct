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
                v-for="ladRow in ladTable.tableRows.getRows()"
                :key="ladRow.objectKeyString"
                :lad-row="ladRow"
                :telemetry-object="tableSet.telemetryObjects[ladRow.objectKeyString]"
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
            viewContext: {}
        };
    },
    computed: {
    },
    mounted() {
        this.tableSet.on('headers-added', this.updateHeaders);
        this.tableSet.on('table-added', this.addLadTable);
        this.tableSet.on('table-removed', this.removeLadTable);
        this.tableSet.initialize();

    },
    destroyed() {
        this.tableSet.off('headers-added', this.updateHeaders);
        this.tableSet.off('table-added', this.addLadTable);
        this.tableSet.off('table-removed', this.removeLadTable);
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
        removeLadTable(identifier) {
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
        }
    }
};
</script>
