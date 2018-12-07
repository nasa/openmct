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
    <div class="l-layout__frame c-frame has-local-controls no-frame"
         :class="{
            'u-inspectable': item.inspectable
         }"
         :style="style">
        <svg width="100%"
             height="100%">
            <line x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                  :stroke="item.stroke"
                  stroke-width="2">
            </line>
        </svg>

        <div class="c-frame-edit">
            <div class="c-frame-edit__move"
                 @mousedown="startDrag($event)"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--nw"
                 @mousedown="startDrag($event)"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--se"
                 @mousedown="startDrag($event)"></div>
        </div>
    </div>
</template>

 <script>
    export default {
        makeDefinition() {
            return {
                x: 5,
                y: 3,
                x2: 6,
                y2: 6,
                stroke: "#717171"
            };
        },
        inject: ['openmct'],
        props: {
            item: Object,
            gridSize: Array,
            initSelect: Boolean,
            index: Number
        },
        computed: {
            style() {
                let width = this.gridSize[0] * Math.abs(this.item.x - this.item.x2);
                let height = this.gridSize[1] * Math.abs(this.item.y - this.item.y2);
                let left = this.gridSize[0] * Math.min(this.item.x, this.item.x2);
                let top = this.gridSize[1] * Math.min(this.item.y, this.item.y2);
                return {
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    minWidth: `${width}px`,
                    minHeight: `${height}px`,
                    position: 'absolute'
                };
            },
            // width() {
            //     return this.gridSize[0] * Math.abs(this.item.x - this.item.x2);
            // },
            // height() {
            //     return
            // },
        },
        methods: {
            startDrag(event) {

            }
        },
        mounted() {
            let context = {
                layoutItem: this.item,
                index: this.index
            };

            this.removeSelectable = this.openmct.selection.selectable(
                this.$el,
                context,
                this.initSelect
            );
        },
        destroyed() {
            if (this.removeSelectable) {
                this.removeSelectable();
            }
        }
    }
 </script>
