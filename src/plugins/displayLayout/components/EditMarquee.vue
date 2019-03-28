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
                 @mousedown="startResize([1,1], [-1,-1], $event, 'nw')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--ne"
                 @mousedown="startResize([0,1], [1,-1], $event, 'ne')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--sw"
                 @mousedown="startResize([1,0], [-1,1], $event, 'sw')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--se"
                 @mousedown="startResize([0,0], [1,1], $event, 'se')"></div>
        </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-frame-edit {
        // In Layouts, this is the editing rect and handles
        pointer-events: none;
        @include abs();
        border: $editMarqueeBorder;

        &__handle {
            $d: 6px;
            $o: floor($d * -0.5);
            background: $editFrameColorHandleFg;
            box-shadow: $editFrameColorHandleBg 0 0 0 2px;
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
                dragPosition: undefined
            }
        },
        computed: {
            style() {
                let x = Number.POSITIVE_INFINITY;
                let y = Number.POSITIVE_INFINITY;
                let width = Number.NEGATIVE_INFINITY;
                let height = Number.NEGATIVE_INFINITY;
                this.selectedLayoutItems.forEach(item => {
                    if (item.x2) {
                        let lineWidth = Math.abs(item.x - item.x2);
                        let lineMinX = Math.min(item.x, item.x2);
                        x = Math.min(lineMinX, x);
                        width = Math.max(lineWidth + lineMinX, width);
                    } else {
                        x = Math.min(item.x, x);
                        width = Math.max(item.width + item.x, width);
                    }

                    if (item.y2) {
                        let lineHeight = Math.abs(item.y - item.y2);
                        let lineMinY = Math.min(item.y, item.y2);
                        y = Math.min(lineMinY, y);
                        height = Math.max(lineHeight + lineMinY, height);
                    } else {
                        y = Math.min(item.y, y);
                        height = Math.max(item.height + item.y, height);
                    }
                });

                if (this.dragPosition) {
                    [x, y] = this.dragPosition.position;
                    [width, height] = this.dragPosition.dimensions;
                } else {
                    width = width - x;
                    height = height - y;
                }

                this.marqueePosition = {
                    x: x,
                    y: y,
                    width: width,
                    height: height
                }
                // console.log('marqueePosition', this.marqueePosition);
                return this.getMarqueeStyle(x, y, width, height);
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
            startResize(posFactor, dimFactor, event, direction) {
                this.direction = direction;
                document.body.addEventListener('mousemove', this.continueResize);
                document.body.addEventListener('mouseup', this.endResize);
                this.initialMarqueePosition = {
                    position: [this.marqueePosition.x, this.marqueePosition.y],
                    dimensions: [this.marqueePosition.width, this.marqueePosition.height]
                };
                this.updatePosition(event);
                this.activeDrag = new LayoutDrag(this.initialMarqueePosition, posFactor, dimFactor, this.gridSize);
                event.preventDefault();
            },
            continueResize(event) {
                event.preventDefault();
                this.updatePosition(event);
                this.dragPosition = this.activeDrag.getAdjustedPositionAndDimensions(this.delta);
            },
            endResize(event) {
                document.body.removeEventListener('mousemove', this.continueResize);
                document.body.removeEventListener('mouseup', this.endResize);
                this.continueResize(event);
                // console.log('initialMarqueePosition', this.initialMarqueePosition);
                let marqueeStartingWidth = this.initialMarqueePosition.dimensions[0];
                let marqueeStartingHeight = this.initialMarqueePosition.dimensions[1];
                let marqueeStartingX = this.initialMarqueePosition.position[0];
                let marqueeStartingY = this.initialMarqueePosition.position[1];

                let scaleX = this.dragPosition.dimensions[0] / this.initialMarqueePosition.dimensions[0];
                let scaleY = this.dragPosition.dimensions[1] / this.initialMarqueePosition.dimensions[1];
                let transformOrigin

                if (this.direction === 'nw') {
                    transformOrigin = [
                        marqueeStartingX + marqueeStartingWidth,
                        marqueeStartingY + marqueeStartingHeight
                    ];
                }
                if (this.direction === 'ne') {
                    transformOrigin = [
                        marqueeStartingX,
                        marqueeStartingY + marqueeStartingHeight
                    ];
                }
                if (this.direction === 'sw') {
                    transformOrigin = [
                        marqueeStartingX + marqueeStartingWidth,
                        marqueeStartingY
                    ];
                }
                if (this.direction === 'se') {
                    transformOrigin = [
                        marqueeStartingX,
                        marqueeStartingY
                    ];
                }

                this.$emit('endResize', scaleX, scaleY, transformOrigin[0], transformOrigin[1], this.direction);
                this.dragPosition = undefined;
                this.initialPosition = undefined;
                this.initialMarqueePosition = undefined;
                this.direction = undefined;
                this.delta = undefined;
                event.preventDefault();
            }
        }
    }
</script>
