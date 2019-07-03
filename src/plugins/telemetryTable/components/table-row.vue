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
    class="noselect"
    :class="[
        rowLimitClass,
        {'is-selected': marked}
    ]"
    @click="markRow">
    <td v-for="(title, key) in headers" 
        :key="key"
        :style="columnWidths[key] === undefined ? {} : { width: columnWidths[key] + 'px', 'max-width': columnWidths[key] + 'px'}"
        :title="formattedRow[key]"
        :class="cellLimitClasses[key]">{{formattedRow[key]}}</td>
</tr>
</template>

<style>
    .noselect {
    -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -khtml-user-select: none; /* Konqueror HTML */
        -moz-user-select: none; /* Firefox */
            -ms-user-select: none; /* Internet Explorer/Edge */
                user-select: none; /* Non-prefixed version, currently
                                    supported by Chrome and Opera */
    }
</style>

<script>
export default {
    data: function () {
        return {
            rowTop: (this.rowOffset + this.rowIndex) * this.rowHeight + 'px',
            formattedRow: this.row.getFormattedDatum(this.headers),
            rowLimitClass: this.row.getRowLimitClass(),
            cellLimitClasses: this.row.getCellLimitClasses()
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
        },
        marked: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    methods: {
        calculateRowTop: function (rowOffset) {
            this.rowTop = (rowOffset + this.rowIndex) * this.rowHeight + 'px';
        },
        formatRow: function (row) {
            this.formattedRow = row.getFormattedDatum(this.headers);
            this.rowLimitClass = row.getRowLimitClass();
            this.cellLimitClasses = row.getCellLimitClasses();
        },
        markRow: function (event) {
            if (event.shiftKey) {
                this.$emit('markMultipleConcurrent', this.rowIndex);
            } else {
                if (this.marked) {
                    this.$emit('unmark', this.rowIndex);
                } else {
                    this.$emit('mark', this.rowIndex);
                }
            }
        }
    },
    // TODO: use computed properties
    watch: {
        rowOffset: 'calculateRowTop',
        row: {
            handler: 'formatRow',
            deep: false
        }
    }
}
</script>
