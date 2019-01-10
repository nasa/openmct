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
            border: 1px solid $colorInteriorBorder;
            padding: $interiorMargin;
        }
    }

    .is-editing {
        .c-frame {
            $moveBarOutDelay: 500ms;
            border: $editSelectableBorder;

            &-edit__move,
            .c-so-view {
                transition: $transOut;
                transition-delay: $moveBarOutDelay;
            }

            &:not([s-selected]) {
                &:hover {
                    border: $editSelectableBorderHov;
                }
            }

            &[s-selected] {
                border: $editSelectableBorderSelected;

                > .c-frame-edit {
                    [class*='__handle'] { display: block; }
                }
            }

            &:not(.is-resizing) {
                // Show and animate the __move bar for sub-object views with complex content
                &:hover {
                    > .c-so-view.has-complex-content {
                        &.c-so-view--no-frame {
                            // If the object's frame is hidden, move content down so the __move bar doesn't cover it.
                            padding-top: 20px;
                            transition: $transIn;
                        }

                        // If object frame is visible, overlap the __move bar over the header
                        + .c-frame-edit .c-frame-edit__move {
                            height: 15px;
                            transition: $transIn;
                            &:hover {
                                background: $editSelectableColorSelected;
                                &:before {
                                    color: $editSelectableColorSelectedFg;
                                }
                            }
                        }
                    }
                }
            }
        }
        .c-frame-edit {
            // In Layouts, this is the editing rect and handles
            // In Fixed Position, this is a wrapper element
            $z: 10;

            @include abs();
            display: contents;
            z-index: $z; // Not sure this is doing anything...

            &__move {
                @include abs();
                cursor: move;
            }

            &__handle {
                $d: 8px;
                $o: floor($d * -0.5);
                background: rgba($editColor, 0.3);
                border: 1px solid $editColor;
                display: none; // Set to block via s-selected selector
                position: absolute;
                width: $d; height: $d;
                top: auto; right: auto; bottom: auto; left: auto;

                &:before {
                    // Extended hit area
                    @include abs(-5px);
                    content: '';
                    display: block;
                    z-index: -1;
                }

                &:hover {
                    background: $editColor;
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
                background: $editColorBgBase; // rgba($editColor, 0.7);
                box-shadow: rgba(black, 0.7) 0 1px 2px;
                bottom: auto;
                height: 0; // Height is set on hover on s-selected.c-frame
                opacity: 0.8;
                max-height: 100%;
                overflow: hidden;
                text-align: center;

                &:before {
                    // Grippy
                    content: $glyph-icon-grippy;
                    color: $editColor;
                    font-family: symbolsfont;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform-origin: center;
                    transform: translate(-50%,-50%) rotate(90deg);
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
