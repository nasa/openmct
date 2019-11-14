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
  <div
    class="l-layout__frame c-frame"
    :class="{
      'no-frame': !item.hasFrame,
      'u-inspectable': inspectable
    }"
    :style="style"
  >
    <slot />

    <div
      class="c-frame-edit__move"
      @mousedown="startMove([1,1], [0,0], $event)"
    />
  </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************* FRAME */
    .c-frame {
        display: flex;
        flex-direction: column;

        // Whatever is placed into the slot, make it fill the entirety of the space, obeying padding
        > *:first-child {
            flex: 1 1 auto;
        }
    }

    .c-frame-edit__move {
        display: none;
    }

    .is-editing {
        /******************* STYLES FOR C-FRAME WHILE EDITING */
        .c-frame {
            &:not([s-selected]) {
                &:hover {
                    border: $editFrameBorderHov;
                }
            }

            &[s-selected] {
                // All frames selected while editing
                border: $editFrameSelectedBorder;
                box-shadow: $editFrameSelectedShdw;

                .c-frame-edit__move {
                    cursor: move;
                }
            }
        }

        /******************* DEFAULT STYLES FOR -EDIT__MOVE */
        // All object types
        .c-frame-edit__move {
            @include abs();
            display: block;
        }

        // Has-complex-content objects
        .c-so-view.has-complex-content {
            transition: $transOut;
            transition-delay: $moveBarOutDelay;

            > .c-so-view__local-controls {
                transition: transform 250ms ease-in-out;
                transition-delay: $moveBarOutDelay;
            }

            + .c-frame-edit__move {
                display: none;
            }

        }

        .l-layout {
            /******************* 0 - 1 ITEM SELECTED */
            &:not(.is-multi-selected) {
                > .l-layout__frame[s-selected] {
                    > .c-so-view.has-complex-content {
                        > .c-so-view__local-controls {
                            transition: transform $transOutTime ease-in-out;
                            transition-delay: $moveBarOutDelay;
                        }

                        + .c-frame-edit__move {
                            transition: $transOut;
                            transition-delay: $moveBarOutDelay;
                            @include userSelectNone();
                            background: $editFrameMovebarColorBg;
                            box-shadow: rgba(black, 0.2) 0 1px;
                            bottom: auto;
                            display: block;
                            height: 0; // Height is set on hover below
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
                                top: $tbOffset;
                                right: $lrOffset;
                                bottom: $tbOffset;
                                left: $lrOffset;
                            }
                        }
                    }

                    &:hover {
                        > .c-so-view.has-complex-content {
                            transition: $transIn;
                            transition-delay: 0s;
                            padding-top: $editFrameMovebarH + $interiorMarginSm;

                            > .c-so-view__local-controls {
                                transform: translateY($editFrameMovebarH);
                                transition: transform $transInTime ease-in-out;
                                transition-delay: 0s;
                            }

                            + .c-frame-edit__move {
                                transition: $transIn;
                                transition-delay: 0s;
                                height: $editFrameMovebarH;
                            }
                        }
                    }
                }
            }

            /******************* > 1 ITEMS SELECTED */
            &.is-multi-selected {
                .l-layout__frame[s-selected] {
                    > .c-so-view.has-complex-content + .c-frame-edit__move {
                        display: block;
                    }
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
