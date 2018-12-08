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
            }
        },
        methods: {
            startDrag(event) {
                document.body.addEventListener('mousemove', this.continueDrag);
                document.body.addEventListener('mouseup', this.endDrag);
                this.dragPosition = {
                    x: this.item.x,
                    y: this.item.y,
                    x2: this.item.x2,
                    y2: this.item.y2
                };
                this.updatePosition(event);
                event.preventDefault();
            },
            continueDrag(event) {
                event.preventDefault();
                this.updatePosition(event);
                this.dragPosition = this.getAdjustedPosition(this.delta);
                console.log('adjusted position');
            },
            endDrag(event) {
                document.body.removeEventListener('mousemove', this.continueDrag);
                document.body.removeEventListener('mouseup', this.endDrag);
                this.continueDrag(event);
                let {x, y, x2, y2} = this.dragPosition;
                // this.$emit('endDrag', this.item, {x, y, x2, y2});
                this.dragPosition = undefined;
                this.initialPosition = undefined;
                this.delta = undefined;
                event.preventDefault();
            },
            updatePosition(event) {
                let currentPosition = [event.pageX, event.pageY];
                this.initialPosition = this.initialPosition || currentPosition;
                console.log('initial position', this.initialPosition);
                this.delta = currentPosition.map(function (value, index) {
                    return value - this.initialPosition[index];
                }.bind(this));
            },
            getAdjustedPosition(delta) {
                console.log("delta", delta);
                // TODO: calculate the new position
                let newX = this.dragPosition.x + Math.round(delta[0] / this.gridSize[0]);
                let newY = this.dragPosition.y + Math.round(delta[1] / this.gridSize[1]);
                let newX2;
                let newY2;

                return {
                    x: newX,
                    y: newY,
                    x2: newX2,
                    y2: newY2
                };
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
