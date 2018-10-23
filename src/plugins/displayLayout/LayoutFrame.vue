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
    <div class="c-frame has-local-controls is-selectable is-moveable"
         :style="item.style"
         :class="classObject"
         @dblclick="drill(item.id, $event)">
        <div class="c-frame__header">
            <div class="c-frame__header__start">
                <div class="c-frame__name icon-object">{{ item.domainObject.name }}</div>
                <div class="c-frame__context-actions c-disclosure-button"></div>
            </div>
            <div class="c-frame__header__end">
                <div class="c-button icon-expand local-controls--hidden"></div>
            </div>
        </div>
        <object-view class="c-frame__object-view"
                     :object="item.domainObject"></object-view>

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
        border-width: 1px;
        border-color: transparent;

        /*************************** HEADER */
        &__header {
            display: flex;
            align-items: center;
            flex: 0 0 auto;
            margin-bottom: $interiorMargin;

            > [class*="__"] {
                display: flex;
                align-items: center;
            }

            > * + * {
                margin-left: $interiorMargin;
            }

            [class*="__start"] {
                flex: 1 1 auto;
                overflow: hidden;
            }

            [class*="__end"] {
                //justify-content: flex-end;
                flex: 0 0 auto;

                [class*="button"] {
                    font-size: 0.7em;
                }
            }
        }

        &__name {
            @include ellipsize();
            flex: 0 1 auto;
            font-size: 1.2em;

            &:before {
                // Object type icon
                flex: 0 0 auto;
                margin-right: $interiorMarginSm;
            }
        }

        /*************************** OBJECT VIEW */
        &__object-view {
            flex: 1 1 auto;
            overflow: auto;

            .c-object-view {
                .u-fills-container {
                    // Expand component types that fill a container
                    @include abs();
                }
            }
        }

        /*************************** NO-FRAME */
        &.no-frame {
            > [class*="__header"] {
                display: none;
            }
        }

        &:not(.no-frame) {
            background: $colorBodyBg;
            border: 1px solid $colorInteriorBorder;
            padding: $interiorMargin;
        }

        // Styles moved to _global.scss;
    }
</style>


<script>
    import ObjectView from '../../ui/components/layout/ObjectView.vue'
    import LayoutDrag from './LayoutDrag'

    export default {
        inject: ['openmct'],
        props: {
            item: Object,
            gridSize: Array
        },
        components: {
            ObjectView
        },
        computed: {
            classObject: function () {
                return {
                    'is-drilled-in': this.item.drilledIn,
                    'no-frame': !this.item.hasFrame
                }
            }
        },
        methods: {
            drill(id, $event) {
                if ($event) {
                    $event.stopPropagation();
                }

                if (!this.isBeingEdited(this.item.domainObject)) {
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
            isBeingEdited(object) {
                // TODO: add logic when inEditContext() is implemented in Vue.
                return true;
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

                this.updatePosition(event);
                this.activeDrag = new LayoutDrag(
                    this.item.rawPosition,
                    posFactor,
                    dimFactor,
                    this.gridSize
                );
                event.preventDefault();
            },
            continueDrag(event) {
                event.preventDefault();
                this.updatePosition(event);

                if (this.activeDrag) {
                    this.$emit('dragInProgress', this.item.id, this.activeDrag.getAdjustedPosition(this.delta));
                }
            },
            endDrag(event) {
                document.body.removeEventListener('mousemove', this.continueDrag);
                document.body.removeEventListener('mouseup', this.endDrag);
                this.continueDrag(event);
                this.$emit('endDrag', this.item.id);
                this.initialPosition = undefined;
                event.preventDefault();
            }
        },
        mounted() {
            this.removeSelectable = this.openmct.selection.selectable(
                this.$el,
                {
                    item: this.item.domainObject
                },
                this.item.initSelect
            );
        },
        destroyed() {
            this.removeSelectable();
        }
    }
</script>