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
        :style="{
            'flex-basis': `${frame.size}%`
        }">

        <div class="c-frame c-fl-frame__drag-wrapper is-selectable u-inspectable is-moveable"
             draggable="true"
             @dragstart="initDrag"
             ref="frame">

            <object-frame
                v-if="domainObject"
                :domain-object="domainObject"
                :object-path="objectPath"
                :has-frame="hasFrame"
                ref="objectFrame">
            </object-frame>

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
import ObjectFrame from '../../../ui/components/ObjectFrame.vue';
import isEditingMixin from '../mixins/isEditing';

export default {
    inject: ['openmct'],
    props: ['frame', 'index', 'containerIndex'],
    mixins: [isEditingMixin],
    data() {
        return {
            domainObject: undefined,
            objectPath: undefined
        }
    },
    components: {
        ResizeHandle,
        ObjectFrame
    },
    computed: {
        hasFrame() {
            return !this.frame.noFrame;
        }
    },
    methods: {
        setDomainObject(object) {
            this.domainObject = object;
            this.objectPath = [object];
            this.setSelection();
        },
        setSelection() {
            this.$nextTick(function () {
                let childContext = this.$refs.objectFrame.getSelectionContext();
                childContext.item = this.domainObject;
                childContext.type = 'frame';
                childContext.frameId = this.frame.id;
                childContext.addContainer = this.addContainer;
                this.unsubscribeSelection = this.openmct.selection.selectable(this.$refs.frame, childContext, false);
            });
        },
        initDrag(event) {
            event.dataTransfer.setData('frameid', this.frame.id);
            event.dataTransfer.setData('containerIndex', this.containerIndex);
        }
    },
    mounted() {
        if (this.frame.domainObjectIdentifier) {
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
