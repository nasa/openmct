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
<th 
    :style="{ width: columnWidths[headerKey] + 'px', 'max-width': columnWidths[headerKey] + 'px'}"
    :draggable="isEditing"
    @mouseup="sort"
    v-on="isEditing ? {
        dragstart: columnMoveStart,
        drop: columnMoveEnd,
        dragleave: hideDropTarget,
        dragover: ($event) => dragOverColumn($event.currentTarget, $event)
    } : {}">
        <div class="c-telemetry-table__headers__content" :class="[
            isSortable ? 'is-sortable' : '', 
            isSortable && sortOptions.key === headerKey ? 'is-sorting' : '', 
            isSortable && sortOptions.direction].join(' ')">
            <div v-if="isEditing" class="c-telemetry-table__resize-hotzone c-telemetry-table__resize-hotzone--right"
                @mousedown="startResizeColumn"
            ></div>
            <slot></slot>
        </div>
</th>
</template>
<style lang="scss">
    @import "~styles/sass-base";
    @import "~styles/table";

    $hotzone-size: 6px;

    .c-telemetry-table__headers__content {
        width: 100%;
    }

    .c-table.c-telemetry-table {
        .c-telemetry-table__resize-hotzone {
            display: block;
            position: absolute;
            height: 100%;
            padding: 0;
            margin: 0;
            width: $hotzone-size;
            min-width: $hotzone-size;
            cursor: col-resize;
            border: none;
            right: 0px;
            margin-right: -$tabularTdPadLR - 1 - $hotzone-size / 2;
        }
        th:last-child .c-telemetry-table__resize-hotzone {
            margin-right: -$tabularTdPadLR - 1;
        }
    }
</style>
<script>
import _ from 'lodash';
const MOVE_COLUMN_DT_TYPE = 'movecolumnfromindex';

export default {
    inject: ['openmct'],
    data() {
        return {
            isEditing: false
        }
    },
    props: {
        headerKey: String,
        headerIndex: Number,
        isHeaderTitle: Boolean,
        sortOptions: Object,
        columnWidths: Object,
        hotzone: Boolean
    },
    computed: {
        isSortable() {
            return this.sortOptions !== undefined;
        }
    },
    methods: {
        startResizeColumn($event) {
            this.resizeStartX = event.clientX;
            this.resizeStartWidth = this.columnWidths[this.headerKey];

            document.addEventListener('mouseup', ()=>{
                this.resizeStartX = undefined;
                this.resizeStartWidth = undefined;
                document.removeEventListener('mousemove', this.resizeColumn);
                event.preventDefault();
                event.stopPropagation();
            }, {once: true, capture: true});
            document.addEventListener('mousemove', this.resizeColumn);
            event.preventDefault();
        },
        resizeColumn(event) {
            let delta = event.clientX - this.resizeStartX;
            let newWidth = this.resizeStartWidth + delta;
            let minWidth = parseInt(window.getComputedStyle(this.$el).minWidth);
            if (newWidth > minWidth) {
                this.$emit('resizeColumn', this.headerKey, newWidth);
            }
        },
        columnMoveStart(event) {
            event.dataTransfer.setData(MOVE_COLUMN_DT_TYPE, this.headerIndex);
        },
        isColumnMoveEvent(event) {
            return [...event.dataTransfer.types].includes(MOVE_COLUMN_DT_TYPE);
        },
        dragOverColumn(element, event) {
            if (this.isColumnMoveEvent(event)){
                event.preventDefault();
                this.updateDropOffset(element, event.clientX);
            } else {
                return false;
            }
        },
        updateDropOffset(element, clientX) {
            let thClientLeft = element.getBoundingClientRect().x;
            let offsetInHeader = clientX - thClientLeft;
            let dropOffsetLeft;

            if (offsetInHeader < element.offsetWidth / 2) {
                dropOffsetLeft = element.offsetLeft;
            } else {
                dropOffsetLeft = element.offsetLeft + element.offsetWidth;
            }
            this.$parent.$emit('drop-target-offset-changed', dropOffsetLeft);
            this.$parent.$emit('drop-target-active', true);
        },
        hideDropTarget(){
            this.$parent.$emit('drop-target-active', false);
        },
        columnMoveEnd(event){
            if (this.isColumnMoveEvent(event)){
                let toIndex = this.headerIndex;
                let fromIndex = event.dataTransfer.getData(MOVE_COLUMN_DT_TYPE);
                if (event.offsetX < event.target.offsetWidth / 2) {
                    if (toIndex > fromIndex){
                        toIndex--;
                    }
                } else {
                    if (toIndex < fromIndex){
                        toIndex++;
                    }
                }
                if (toIndex !== fromIndex) {
                    this.$parent.$emit('reorder-column', fromIndex, toIndex);
                }
            }
        },
        sort(){
            this.$emit("sort");
        },
        toggleEditMode(isEditing) {
            this.isEditing = isEditing;
        }
    },
    created() {
        this.resizeColumn = _.throttle(this.resizeColumn, 50);

        this.openmct.editor.on('isEditing', this.toggleEditMode);
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.toggleEditMode);
    }
}
</script>