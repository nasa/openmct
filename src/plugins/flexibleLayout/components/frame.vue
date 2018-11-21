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
        :class="{
            'is-dragging': isDragging
        }"
        @dragstart="initDrag"
        @drag="continueDrag">

        <div class="c-frame c-fl-frame__drag-wrapper is-selectable is-moveable"
             :class="{'no-frame': noFrame}"
             draggable="true"
             ref="frame"
             v-if="frame.domainObjectIdentifier.key">

            <subobject-view
                v-if="item.domainObject.identifier"
                :item="item">
            </subobject-view>

            <div class="c-fl-frame__size-indicator"
                 v-if="isEditing"
                 v-show="frame.size && frame.size < 100">
                {{frame.size}}%
            </div>
        </div>
    </div>
</template>

<script>
import ResizeHandle from './resizeHandle.vue';
import SubobjectView from '../../displayLayout/components/SubobjectView.vue';

export default {
    inject: ['openmct', 'domainObject'],
    props: ['frame', 'index', 'containerIndex', 'isEditing', 'isDragging'],
    data() {
        return {
            item: {domainObject: {}},
            noFrame: this.frame.noFrame
        }
    },
    components: {
        ResizeHandle,
        SubobjectView
    },
    methods: {
        setDomainObject(object) {
            this.item.domainObject = object;
            this.setSelection();
        },
        setSelection() {
           
            let context = {
                item: this.item.domainObject,
                method: this.deleteFrame,
                addContainer: this.addContainer,
                type: 'frame',
                index: this.index
            };

            this.unsubscribeSelection = this.openmct.selection.selectable(this.$refs.frame, context, false);
            
            this.openmct.objects.observe(this.domainObject, `configuration.containers[${this.containerIndex}].frames[${this.index}].noFrame`, this.toggleFrame);

        },
        initDrag(event) {
            this.$emit('frame-drag-from', this.index);
        },
        continueDrag(event) {
            if (!this.isDragging) {
                this.isDragging = true;
            }
        },
        deleteFrame() {
            this.$emit('delete-frame', this.index);
        },
        addContainer() {
            this.$emit('add-container');
        },
        toggleFrame(v) {
            this.noFrame = v;
        }
    },
    mounted() {
        if (this.frame.domainObjectIdentifier.key) {
            this.openmct.objects.get(this.frame.domainObjectIdentifier).then((object)=>{
                this.setDomainObject(object);
            });
        }
    },
    beforeDestroy() {
        if (this.unsubscribeSelection) {
            this.unsubscribeSelection();
        }
    }
}
</script>
