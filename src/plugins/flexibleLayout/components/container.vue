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
    <div class="c-fl-container"
         :style="[{'flex-basis': sizeString}]"
         :class="{'is-empty': !frames.length}">
        <div class="c-fl-container__header icon-grippy-ew"
            v-show="isEditing"
            draggable="true"
            @dragstart="startContainerDrag">
            <span class="c-fl-container__size-indicator">{{ sizeString }}</span>
        </div>

        <drop-hint
            class="c-fl-frame__drop-hint"
            :index="-1"
            :allow-drop="allowDrop"
            @object-drop-to="frameDropTo">
        </drop-hint>

        <div class="c-fl-container__frames-holder">
            <template
                 v-for="(frame, i) in frames">

                <frame-component
                    class="c-fl-container__frame"
                    :key="frame.id"
                    :frame="frame"
                    :index="i"
                    :containerIndex="index">
                </frame-component>

                <drop-hint
                    class="c-fl-frame__drop-hint"
                    :key="i"
                    :index="i"
                    :allowDrop="allowDrop"
                    @object-drop-to="frameDropTo">
                </drop-hint>

                <resize-handle
                    v-if="(i !== frames.length - 1)"
                    :key="i"
                    :index="i"
                    :orientation="rowsLayout ? 'horizontal' : 'vertical'"
                    @init-move="startFrameResizing"
                    @move="frameResizing"
                    @end-move="endFrameResizing">
                </resize-handle>
            </template>
        </div>
    </div>
</template>

<script>
import FrameComponent from './frame.vue';
import Frame from '../utils/frame';
import ResizeHandle from './resizeHandle.vue';
import DropHint from './dropHint.vue';
import isEditingMixin from '../mixins/isEditing';

const SNAP_TO_PERCENTAGE = 1;
const MIN_FRAME_SIZE = 5;

export default {
    inject:['openmct'],
    props: ['container', 'index', 'rowsLayout'],
    mixins: [isEditingMixin],
    components: {
        FrameComponent,
        ResizeHandle,
        DropHint
    },
    data() {
        return {
            maxMoveSize: 0
        }
    },
    computed: {
        frames() {
            return this.container.frames;
        },
        sizeString() {
            return `${Math.round(this.container.size)}%`
        }
    },
    methods: {
        allowDrop(event, index) {
            let frameId = event.dataTransfer.getData('frameid'),
                containerIndex = Number(event.dataTransfer.getData('containerIndex'));
            
            if (frameId) {

                if (containerIndex === this.index) {
                    let frame = this.container.frames.filter((f) => f.id === frameId)[0],
                        framePos = this.container.frames.indexOf(frame);

                    if (index === -1) {
                        return framePos !== 0;
                    } else {
                        return framePos !== index && (framePos - 1) !== index
                    }
                } else {
                    return true;
                }
            } else {
                if (event.dataTransfer.getData('domainObject')) {
                    return true;
                } else {
                    return false;
                }
            }
        },
        frameDropTo(index, event) {
            let domainObject = event.dataTransfer.getData('domainObject'),
                frameId = event.dataTransfer.getData('frameid'),
                containerIndex = Number(event.dataTransfer.getData('containerIndex')),
                options;

            if (domainObject) {
                let frameObject = new Frame(JSON.parse(domainObject).identifier);
                options = {
                    frameObject
                }
            } else if (frameId) {
                let frameLocation = [frameId, containerIndex];

                options = {
                    frameLocation
                }
            }

            options.dropHintIndex = index;

            this.$emit('frame-drop-to', this.index, options);
        },
        startFrameResizing(index) {
            let beforeFrame = this.frames[index],
                afterFrame = this.frames[index + 1];
            
            this.maxMoveSize = beforeFrame.size + afterFrame.size;
        },
        frameResizing(index, delta, event) {

            let percentageMoved = (delta / this.getElSize(this.$el))*100,
                beforeFrame = this.frames[index],
                afterFrame = this.frames[index + 1];

            beforeFrame.size = this.snapToPercentage(beforeFrame.size + percentageMoved);
            afterFrame.size = this.snapToPercentage(afterFrame.size - percentageMoved);
        },
        endFrameResizing(index, event) {
            this.persist();
        },
        getElSize(el) {
            if (this.rowsLayout) {
                return el.offsetWidth;
            } else {
                return el.offsetHeight;
            }
        },
        getFrameSize(size) {
            if (size < MIN_FRAME_SIZE) {
                return MIN_FRAME_SIZE
            } else if (size > (this.maxMoveSize - MIN_FRAME_SIZE)) {
                return (this.maxMoveSize - MIN_FRAME_SIZE);
            } else {
                return size;
            }
        },
        snapToPercentage(value){
            let rem = value % SNAP_TO_PERCENTAGE,
                roundedValue;
            
            if (rem < 0.5) {
                 roundedValue = Math.floor(value/SNAP_TO_PERCENTAGE)*SNAP_TO_PERCENTAGE;
            } else {
                roundedValue = Math.ceil(value/SNAP_TO_PERCENTAGE)*SNAP_TO_PERCENTAGE;
            }

            return this.getFrameSize(roundedValue);
        },
        persist() {
            this.$emit('persist', this.index);
        },
        startContainerDrag(event) {
            event.dataTransfer.setData('containerid', this.container.id);
        }
    },
    mounted() {
        let context = {
            item: this.$parent.domainObject,
            addContainer: this.addContainer,
            index: this.index,
            type: 'container'
        }

        this.unsubscribeSelection = this.openmct.selection.selectable(this.$el, context, false);
    },
    beforeDestroy() {
        this.unsubscribeSelection();
    }
}
</script>
