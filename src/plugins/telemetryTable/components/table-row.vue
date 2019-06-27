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
<tr :style="{ top: rowTop }" 
    :class="rowClass"
    @contextmenu="getDomainObjectPath">
    <component
        v-for="(title, key) in headers"
        :key="key"
        :is="componentList[key]"
        :columnKey="key"
        :style="columnWidths[key] === undefined ? {} : { width: columnWidths[key] + 'px', 'max-width': columnWidths[key] + 'px'}"
        :title="formattedRow[key]"
        :class="cellLimitClasses[key]"
        class="is-selectable"
        @click="selectCell($event.currentTarget, key)"
        :row="row">
    </component>
</tr>
</template>

<style>
</style>

<script>

const CONTEXT_MENU_ACTIONS = [
    'View Historical Data',
    'Remove'
];
import TableCell from './table-cell.vue';

export default {
    inject: ['openmct'],
    data: function () {
        return {
            rowTop: (this.rowOffset + this.rowIndex) * this.rowHeight + 'px',
            formattedRow: this.row.getFormattedDatum(this.headers),
            rowClass: this.row.getRowClass(),
            cellLimitClasses: this.row.getCellLimitClasses(),
            componentList: Object.keys(this.headers).reduce((components, header) => {
                components[header] = this.row.getCellComponentName(header) || 'table-cell';
                return components
            }, {})
        }
    },
    props: {
        headers: {
            type: Object,
            required: true
        },
        row: {
            type: Object,
            required: true
        },
        columnWidths: {
            type: Object,
            required: true
        },
        rowIndex: {
            type: Number,
            required: false,
            default: undefined
        },
        rowOffset: {
            type: Number,
            required: false,
            default: 0
        },
        rowHeight: {
            type: Number,
            required: false,
            default: 0
        }
    },
    methods: {
        calculateRowTop: function (rowOffset) {
            this.rowTop = (rowOffset + this.rowIndex) * this.rowHeight + 'px';
        },
        formatRow: function (row) {
            this.formattedRow = row.getFormattedDatum(this.headers);
            this.rowClass = row.getRowClass();
            this.cellLimitClasses = row.getCellLimitClasses();
        },
        getDomainObjectPath: function (event) {
            event.preventDefault();

            this.openmct.objects.getOriginalPath(this.row.objectKeyString).then((path) => {
                this.showContextMenu(path, event);
            });
        },
        showContextMenu: function (path, event) {
            this.openmct.contextMenu._showContextMenuForObjectPath(path, event.x, event.y, CONTEXT_MENU_ACTIONS);
        },
        selectCell(element, columnKey) {
            //TODO: This is a hack. Cannot get parent this way.
            this.openmct.selection.select([{
                element: element,
                context: {
                    type: 'table-cell',
                    row: this.row.objectKeyString,
                    column: columnKey
                }
            },{
                element: this.openmct.layout.$refs.browseObject.$el,
                context: {
                    item: this.openmct.router.path[0]
                }
            }], false);
            event.stopPropagation();
        }
    },
    // TODO: use computed properties
    watch: {
        rowOffset: 'calculateRowTop',
        row: {
            handler: 'formatRow',
            deep: false
        }
    },
    components: {
        TableCell
    }
}
</script>
