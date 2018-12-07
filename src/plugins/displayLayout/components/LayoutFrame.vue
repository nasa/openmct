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
    <div class="c-frame has-local-controls"
         :class="{
             'no-frame': !item.hasFrame,
             'u-inspectable': item.inspectable
         }"
         :style="style"
         @dblclick="drill(item.id, $event)">

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
    import SubobjectView from './SubobjectView.vue'
    import TelemetryView from './TelemetryView.vue'
    import BoxView from './BoxView.vue'
    import TextView from './TextView.vue'
    import LineView from './LineView.vue'
    import ImageView from './ImageView.vue'
    import LayoutDrag from './../LayoutDrag'

    const ITEM_TYPE_VIEW_MAP = {
        'subobject-view': SubobjectView,
        'telemetry-view': TelemetryView,
        'box': BoxView,
        'line': TextView,
        'text': LineView,
        'image': ImageView
    };

    export default {
        getItemDefinition(itemType, ...options) {
            let itemView = ITEM_TYPE_VIEW_MAP[itemType];
            if (!itemType) {
                throw `Invalid itemType: ${itemType}`;
            }
            return itemView.makeDefinition(...options);
        },
        inject: ['openmct'],
        props: {
            item: Object,
            gridSize: Array,
            customStyle: {
                type: Object,
                required: false
            }
        },
        components: {
            SubobjectView,
            TelemetryView,
            BoxView,
            TextView,
            LineView,
            ImageView
        },
        computed: {
            style() {
                if (this.customStyle) {
                    return this.customStyle;
                }
                return {
                    left: (this.gridSize[0] * this.item.x) + 'px',
                    top: (this.gridSize[1] * this.item.y) + 'px',
                    width: (this.gridSize[0] * this.item.width) + 'px',
                    height: (this.gridSize[1] * this.item.height) + 'px',
                    minWidth: (this.gridSize[0] * this.item.width) + 'px',
                    minHeight: (this.gridSize[1] * this.item.height) + 'px'
                };
            }
        },
        methods: {
            drill(id, $event) {
                if ($event) {
                    $event.stopPropagation();
                }

                if (!this.openmct.editor.isEditing()) {
                    return;
                }

                if (!this.item.domainObject) {
                    return;
                }

                if (this.openmct.composition.get(this.item.domainObject) === undefined) {
                    return;
                }

                // Disable for fixed position.
                if (this.item.domainObject.type === 'telemetry.fixed') {
                    return;
                }

                this.$emit('drilledIn', id);
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

                let rawPosition = {
                    position: [this.item.x, this.item.y],
                    dimensions: [this.item.width, this.item.height]
                };
                this.updatePosition(event);
                this.activeDrag = new LayoutDrag(rawPosition, posFactor, dimFactor, this.gridSize);
                event.preventDefault();
            },
            continueDrag(event) {
                event.preventDefault();
                this.updatePosition(event);

                if (this.activeDrag) {
                    this.$emit(
                        'dragInProgress',
                        this.item,
                        this.activeDrag.getAdjustedPosition(this.delta)
                    );
                }
            },
            endDrag(event) {
                document.body.removeEventListener('mousemove', this.continueDrag);
                document.body.removeEventListener('mouseup', this.endDrag);
                this.continueDrag(event);
                this.$emit('endDrag', this.item);
                this.initialPosition = undefined;
                event.preventDefault();
            }
        },
        mounted() {
            let context = {
                item: this.item.domainObject,
                layoutItem: this.item,
                addElement: this.$parent.addElement
            };

            this.removeSelectable = this.openmct.selection.selectable(
                this.$el,
                context,
                this.item.initSelect
            );
        },
        destroyed() {
            this.removeSelectable();
        }
    }
</script>
