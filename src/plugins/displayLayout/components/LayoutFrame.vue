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
    <div class="l-layout__frame c-frame"
         :class="{
             'no-frame': !item.hasFrame,
             'u-inspectable': inspectable,
             'is-resizing': isResizing
         }"
         :style="style">

        <slot></slot>

        <!-- Drag handles -->
        <div class="c-frame-edit">
            <div class="c-frame-edit__move"
                 @mousedown="startDrag([1,1], [0,0], $event, 'move')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--nw"
                 @mousedown="startDrag([1,1], [-1,-1], $event, 'resize')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--ne"
                 @mousedown="startDrag([0,1], [1,-1], $event, 'resize')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--sw"
                 @mousedown="startDrag([1,0], [-1,1], $event, 'resize')"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--se"
                 @mousedown="startDrag([0,0], [1,1], $event, 'resize')"></div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* FRAME */
    .c-frame {
        display: flex;
        flex-direction: column;

        // Whatever is placed into the slot, make it fill the entirety of the space, obeying padding
        > *:first-child {
            flex: 1 1 auto;
        }

        &:not(.no-frame) {
            background: $colorBodyBg;
            border: $browseFrameBorder;
            padding: $interiorMargin;
        }

    }

    .c-frame-edit {
        // In Layouts, this is the editing rect and handles
        // In Fixed Position, this is a wrapper element
        @include abs();
        display: none;

        &__move {
            @include abs();
            cursor: move;
        }

        &__handle {
            $d: 6px;
            $o: floor($d * -0.5);
            background: $editFrameColorHandleFg;
            box-shadow: $editFrameColorHandleBg 0 0 0 2px;
            display: none; // Set to block via s-selected selector
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

    .c-so-view.has-complex-content + .c-frame-edit {
        // Target frames that hold domain objects that include header elements, as opposed to drawing and alpha objects
        // Make the __move element a more affordable drag UI element
        .c-frame-edit__move {
            @include userSelectNone();
            background: $editFrameMovebarColorBg;
            box-shadow: rgba(black, 0.2) 0 1px;
            bottom: auto;
            height: 0; // Height is set on hover on s-selected.c-frame
            opacity: 0.8;
            max-height: 100%;
            overflow: hidden;
            text-align: center;

            &:before {
                // Grippy
                $h: 4px;
                $tbOffset: ($editFrameMovebarH - $h) / 2;
                $lrOffset: 25%;
                @include grippy($editFrameMovebarColorFg);
                content: '';
                display: block;
                position: absolute;
                top: $tbOffset; right: $lrOffset; bottom: $tbOffset; left: $lrOffset;
            }

            &:hover {
                background: $editFrameHovMovebarColorBg;
                &:before { @include grippy($editFrameHovMovebarColorFg); }
            }
        }
    }

    .is-editing {
        .c-frame {
            &.no-frame {
                border: $editFrameBorder; // Base border style for a frame element while editing.
            }

            &-edit {
                display: contents;
            }

            &-edit__move,
            .c-so-view {
                transition: $transOut;
                transition-delay: $moveBarOutDelay;
            }

            &:not([s-selected]) {
                &:hover {
                    border: $editFrameBorderHov;
                }
            }

            &[s-selected] {
                // All frames selected while editing
                border: $editFrameSelectedBorder;
                box-shadow: $editFrameSelectedShdw;

                > .c-frame-edit {
                    [class*='__handle'] {
                        display: block;
                    }
                }
            }
        }

        .l-layout__frame[s-selected]:not(.is-resizing) {
            // Show and animate the __move bar for sub-object views with complex content
            > .c-so-view.has-complex-content {
                > .c-so-view__local-controls {
                    transition: transform 250ms ease-in-out;
                    transition-delay: $moveBarOutDelay;
                }
            }

            &:hover > .c-so-view.has-complex-content {
                // Move content down so the __move bar doesn't cover it.
                padding-top: $editFrameMovebarH;
                transition: $transIn;

                > .c-so-view__local-controls {
                    transition: transform 50ms ease-in-out;
                    transform: translateY($editFrameMovebarH);
                }

                &.c-so-view--no-frame {
                    // Move content down with a bit more space
                    padding-top: $editFrameMovebarH + $interiorMarginSm;
                }

                // Show the move bar
                + .c-frame-edit .c-frame-edit__move {
                    height: $editFrameMovebarH;
                    transition: $transIn;
                }
            }
        }
    }
</style>


<script>
    import LayoutDrag from './../LayoutDrag'

    export default {
        inject: ['openmct'],
        props: {
            item: Object,
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
                let {x, y, width, height} = this.item;

                if (this.dragPosition) {
                    [x, y] = this.dragPosition.position;
                    [width, height] = this.dragPosition.dimensions;
                }

                return {
                    left: (this.gridSize[0] * x) + 'px',
                    top: (this.gridSize[1] * y) + 'px',
                    width: (this.gridSize[0] * width) + 'px',
                    height: (this.gridSize[1] * height) + 'px',
                    minWidth: (this.gridSize[0] * width) + 'px',
                    minHeight: (this.gridSize[1] * height) + 'px'
                };
            },
            inspectable() {
                return this.item.type === 'subobject-view' || this.item.type === 'telemetry-view';
            }
        },
        methods: {
            updatePosition(event) {
                let currentPosition = [event.pageX, event.pageY];
                this.initialPosition = this.initialPosition || currentPosition;
                this.delta = currentPosition.map(function (value, index) {
                    return value - this.initialPosition[index];
                }.bind(this));
            },
            startDrag(posFactor, dimFactor, event, type) {
                document.body.addEventListener('mousemove', this.continueDrag);
                document.body.addEventListener('mouseup', this.endDrag);

                this.dragPosition = {
                    position: [this.item.x, this.item.y],
                    dimensions: [this.item.width, this.item.height]
                };
                this.updatePosition(event);
                this.activeDrag = new LayoutDrag(this.dragPosition, posFactor, dimFactor, this.gridSize);
                this.isResizing = type === 'resize';
                event.preventDefault();
            },
            continueDrag(event) {
                event.preventDefault();
                this.updatePosition(event);
                this.dragPosition = this.activeDrag.getAdjustedPosition(this.delta);
            },
            endDrag(event) {
                document.body.removeEventListener('mousemove', this.continueDrag);
                document.body.removeEventListener('mouseup', this.endDrag);
                this.continueDrag(event);
                let [x, y] = this.dragPosition.position;
                let [width, height] = this.dragPosition.dimensions;
                this.$emit('endDrag', this.item, {x, y, width, height});
                this.dragPosition = undefined;
                this.initialPosition = undefined;
                this.delta = undefined;
                this.isResizing = undefined;
                event.preventDefault();
            }
        }
    }
</script>
