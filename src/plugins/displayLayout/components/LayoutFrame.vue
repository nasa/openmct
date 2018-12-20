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
             'is-drilled-in': item.drilledIn
         }"
         :style="style"
         @dblclick="drill($event)">

        <slot></slot>

        <!-- Drag handles -->
        <div class="c-frame-edit">
            <div class="c-frame-edit__move"
                 @mousedown="startDrag([1,1], [0,0], $event)"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--nw"
                 @mousedown="startDrag([1,1], [-1,-1], $event)"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--ne"
                 @mousedown="startDrag([0,1], [1,-1], $event)"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--sw"
                 @mousedown="startDrag([1,0], [-1,1], $event)"></div>
            <div class="c-frame-edit__handle c-frame-edit__handle--se"
                 @mousedown="startDrag([0,0], [1,1], $event)"></div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* FRAME */
    .c-frame {
        display: flex;
        flex-direction: column;
        border: 1px solid transparent;

        /*************************** NO-FRAME */
        &.no-frame {
            > [class*="contents"] > [class*="__header"] {
                display: none;
            }
        }

        &:not(.no-frame) {
            background: $colorBodyBg;
            border: 1px solid $colorInteriorBorder;
            padding: $interiorMargin;
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
                dragPosition: undefined
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
            drill($event) {
                if ($event) {
                    $event.stopPropagation();
                }

                if (!this.openmct.editor.isEditing() || !this.item.identifier) {
                    return;
                }

                this.openmct.objects.get(this.item.identifier)
                    .then(domainObject => {
                        if (this.openmct.composition.get(domainObject) === undefined) {
                            return;
                        }

                        this.$emit('drilledIn', this.item);
                    });
            },
            updatePosition(event) {
                let currentPosition = [event.pageX, event.pageY];
                this.initialPosition = this.initialPosition || currentPosition;
                this.delta = currentPosition.map(function (value, index) {
                    return value - this.initialPosition[index];
                }.bind(this));
            },
            startDrag(posFactor, dimFactor, event) {
                document.body.addEventListener('mousemove', this.continueDrag);
                document.body.addEventListener('mouseup', this.endDrag);

                this.dragPosition = {
                    position: [this.item.x, this.item.y],
                    dimensions: [this.item.width, this.item.height]
                };
                this.updatePosition(event);
                this.activeDrag = new LayoutDrag(this.dragPosition, posFactor, dimFactor, this.gridSize);
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
                event.preventDefault();
            }
        }
    }
</script>
