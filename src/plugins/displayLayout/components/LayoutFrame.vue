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
             'u-inspectable': inspectable
         }"
         :style="style">

        <slot></slot>

        <div class="c-frame-edit__move"
             @mousedown="startMove([1,1], [0,0], $event)">
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

    .is-editing {
        .c-frame {
            $moveBarOutDelay: 500ms;
            &.no-frame {
                border: $editFrameBorder; // Base border style for a frame element while editing.
            }

         /*   &-edit {
                display: contents;
            }*/

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
                // border: $editFrameSelectedBorder;
                // box-shadow: $editFrameSelectedShdw;

             cursor: move;

            /* > .c-frame-edit {
                    [class*='__handle'] {
                        display: block;
                    }
                }*/
            }
        }

        .l-layout__frame:not(.is-resizing) {
            // Show and animate the __move bar for sub-object views with complex content
            &:hover > .c-so-view.has-complex-content {
                // Move content down so the __move bar doesn't cover it.
                padding-top: $editFrameMovebarH;
                transition: $transIn;

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
        computed: {
            style() {
                let {x, y, width, height} = this.item;
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
            startMove(posFactor, dimFactor, event) {
                document.body.addEventListener('mousemove', this.continueMove);
                document.body.addEventListener('mouseup', this.endMove);
                this.dragPosition = {
                    position: [this.item.x, this.item.y]
                };
                this.startPosition = this.dragPosition;
                this.updatePosition(event);
                this.activeDrag = new LayoutDrag(this.dragPosition, posFactor, dimFactor, this.gridSize);
                event.preventDefault();
            },
            continueMove(event) {
                event.preventDefault();
                this.updatePosition(event);
                let newPosition = this.activeDrag.getAdjustedPosition(this.delta);

                if (!_.isEqual(newPosition, this.dragPosition)) {
                    this.dragPosition = newPosition;
                    this.$emit('move', this.toGridDelta(this.delta));
                }
            },
            endMove(event) {
                document.body.removeEventListener('mousemove', this.continueMove);
                document.body.removeEventListener('mouseup', this.endMove);
                this.continueMove(event);
                this.$emit('endMove');
                this.dragPosition = undefined;
                this.initialPosition = undefined;
                this.delta = undefined;
                event.preventDefault();
            },
            toGridDelta(pixelDelta) {
                return pixelDelta.map((v, i) => {
                    return Math.round(v / this.gridSize[i]);
                });
            }
        }
    }
</script>
