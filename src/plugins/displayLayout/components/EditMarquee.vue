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
        <!-- Resize handles -->
        <div class="c-frame-edit" :style="style">
            <div class="c-frame-edit__handle c-frame-edit__handle--nw"
                 @mousedown="startDrag([1,1], [-1,-1], $event, 'resize')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--ne"
                 @mousedown="startDrag([0,1], [1,-1], $event, 'resize')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--sw"
                 @mousedown="startDrag([1,0], [-1,1], $event, 'resize')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--se"
                 @mousedown="startDrag([0,0], [1,1], $event, 'resize')"></div>
        </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-frame-edit {
        // In Layouts, this is the editing rect and handles
        pointer-events: none;
        position: absolute;
        border: $editMarqueeBorder;

        &__handle {
            $d: 6px;
            $o: floor($d * -0.5);
            background: $editFrameColorHandleFg;
            box-shadow: $editFrameColorHandleBg 0 0 0 2px;
            //display: none; // Set to block via s-selected selector
            pointer-events: all;
            position: absolute;
            width: $d; height: $d;
            top: auto; right: auto; bottom: auto; left: auto;

            &:before {
                // Extended hit area
                @include abs(-10px);
                content: '';
                display: block;
                z-index: 0;
            }

            &:hover {
                background: $editUIColor;
            }

            &--nwse {
                cursor: nwse-resize;
            }

            &--nw {
                cursor: nw-resize;
                left: $o; top: $o;
            }

            &--ne {
                cursor: ne-resize;
                right: $o; top: $o;
            }

            &--se {
                cursor: se-resize;
                right: $o; bottom: $o;
            }

            &--sw {
                cursor: sw-resize;
                left: $o; bottom: $o;
            }
        }
    }
</style>


<script>
    import LayoutDrag from './../LayoutDrag'

    export default {
        inject: ['openmct'],
        props: {
            selectedLayoutItems: Array,
            gridSize: Array
        },        
        data() {
            return {
                dragPosition: undefined,
                isResizing: undefined
            }
        },
        computed: {
            style() {
                let minX = Number.POSITIVE_INFINITY;
                let minY = Number.POSITIVE_INFINITY;
                let maxWidth = Number.NEGATIVE_INFINITY;
                let maxHeight = Number.NEGATIVE_INFINITY;
                let positions = [];

                this.selectedLayoutItems.forEach(item => {
                    positions.push({
                        'x': item.x,
                        'y': item.y,
                        'width': item.width,
                        'height': item.height
                    });
                });
                positions.forEach(position => {
                    minY = Math.min(position.y, minY);
                    minX = Math.min(position.x, minX);
                    maxWidth = Math.max(position.width + position.x, maxWidth);
                    maxHeight = Math.max(position.height + position.y, maxHeight);
                });

                // if (this.dragPosition) {
                //     [x, y] = this.dragPosition.position;
                //     [width, height] = this.dragPosition.dimensions;
                // }
                return this.getMarqueeStyle(minX, minY, maxWidth - minX, maxHeight - minY);
            }
        },
        methods: {
            getMarqueeStyle(x, y, width, height) {
                return {
                    left: (this.gridSize[0] * x) + 'px',
                    top: (this.gridSize[1] * y) + 'px',
                    width: (this.gridSize[0] * width) + 'px',
                    height: (this.gridSize[1] * height) + 'px'
                };
            },
            updatePosition(event) {
                let currentPosition = [event.pageX, event.pageY];
                this.initialPosition = this.initialPosition || currentPosition;
                this.delta = currentPosition.map(function (value, index) {
                    return value - this.initialPosition[index];
                }.bind(this));
            },
            startDrag(posFactor, dimFactor, event, type) {
                // console.log('startDrag');
                // document.body.addEventListener('mousemove', this.continueDrag);
                // document.body.addEventListener('mouseup', this.endDrag);

                // this.dragPosition = {
                //     position: [this.item.x, this.item.y],
                //     dimensions: [this.item.width, this.item.height]
                // };
                // this.updatePosition(event);
                // this.activeDrag = new LayoutDrag(this.dragPosition, posFactor, dimFactor, this.gridSize);
                // this.isResizing = type === 'resize';
                // event.preventDefault();
            },
            continueDrag(event) {
                event.preventDefault();
                this.updatePosition(event);
                this.dragPosition = this.activeDrag.getAdjustedPositionAndDimensions(this.delta);
            },
            endDrag(event) {
                // document.body.removeEventListener('mousemove', this.continueDrag);
                // document.body.removeEventListener('mouseup', this.endDrag);
                // this.continueDrag(event);
                // let [x, y] = this.dragPosition.position;
                // let [width, height] = this.dragPosition.dimensions;
                // this.$emit('endDrag', this.item, {x, y, width, height});
                // this.dragPosition = undefined;
                // this.initialPosition = undefined;
                // this.delta = undefined;
                // this.isResizing = undefined;
                // event.preventDefault();
            }
        }
    }
</script>
