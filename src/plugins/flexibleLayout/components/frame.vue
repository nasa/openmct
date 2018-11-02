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
    <div class="c-fl-frame"
        :class="[frame.cssClass]">
        <div class="c-fl-frame__drag-wrapper"
             v-if="frame.domainObject"
             :draggable="isEditing">
            <object-view
                class="c-object-view"
                :object="frame.domainObject">
            </object-view>
        </div>

        <drop-hint
             v-show="isEditing && isDragging"
             class="c-fl-frame__drop-hint"
             :class="{'is-dragging': isDragging}"
             @object-drop-to="dropHandler">
        </drop-hint>

        <resize-handle
             v-show="isEditing && !isDragging"
             :orientation="layoutDirectionStr === 'rows' ? 'horizontal' : 'vertical'"
             @mousemove="resizingHandler"
             @mouseup="endResizingHandler">
        </resize-handle>
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-fl-frame {
        display: flex;
        justify-content: stretch;
        align-items: stretch;
        flex: 1 1;
        flex-direction: column;

        &__drag-wrapper {
            flex: 1 1 100%;
            overflow: auto;
        }

        &__drop-hint {
            flex: 0 0 15px;
            .c-drop-hint {
                border-radius: $smallCr;
            }
        }

        &--empty-container {
            flex-grow: 0;
        }

        .c-fl--rows & {
            flex-direction: row;
        }
    }
</style>

<script>
import ObjectView from '../../../ui/components/layout/ObjectView.vue';
import DropHint from './dropHint.vue';
import ResizeHandle from './resizeHandle.vue';

export default {
    props: ['frame', 'index', 'isEditing', 'isDragging', 'layoutDirectionStr'],
    components: {
        ObjectView,
        DropHint,
        ResizeHandle
    },
    methods: {
        dragstart(event) {
            this.$emit('object-drag-from', this.index);
        },
        dropHandler(event) {
            this.$emit('object-drop-to', this.index, event);
        },
        resizingHandler(delta) {
            this.$emit('frame-resizing', this.index, delta);
        },
        endResizingHandler(event){
            this.$emit('end-frame-resizing', event);
        }
    },
    mounted() {
        this.$el.addEventListener('dragstart', this.dragstart);
    },
    beforeDestroy() {
        this.$el.removeEventListener('dragstart', this.dragstart);
    }
}
</script>
