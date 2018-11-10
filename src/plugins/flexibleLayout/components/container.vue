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
         :style="[{'flex-basis': size}]"
         :class="{'is-empty': frames.length === 1}">
        <div class="c-fl-container__header icon-grippy-ew"
            v-show="isEditing"
            draggable="true"
            @dragstart="startContainerDrag"
            @dragend="stopContainerDrag">
            <span class="c-fl-container__size-indicator">{{ size }}</span>
        </div>
        <div class="c-fl-container__frames-holder">
            <div class="u-contents"
                 v-for="(frame, i) in frames"
                 :key="i">

                <frame-component
                    class="c-fl-container__frame"
                    :style="{
                        'flex-basis': `${frame.height}%`
                    }"
                    :frame="frame"
                    :size="frame.height"
                    :index="i"
                    :containerIndex="index"
                    :isEditing="isEditing"
                    :isDragging="isDragging"
                    @frame-drag-from="frameDragFrom"
                    @frame-drop-to="frameDropTo"
                    @delete-frame="promptBeforeDeletingFrame"
                    @add-container="addContainer">
                </frame-component>

                <resize-handle
                    v-if="i !== 0 && (i !== frames.length - 1)"
                    v-show="isEditing"
                    :index="i"
                    :orientation="rowsLayout ? 'horizontal' : 'vertical'"
                    @init-move="startFrameResizing"
                    @move="frameResizing"
                    @end-move="endFrameResizing">
                </resize-handle>
            </div>
        </div>
    </div>
</template>

<script>
import FrameComponent from './frame.vue';
import Frame from '../utils/frame';
import ResizeHandle from './resizeHandle.vue';

const SNAP_TO_PERCENTAGE = 1;
const MIN_FRAME_SIZE = 5;

export default {
    inject:['openmct', 'domainObject'],
    props: ['size', 'frames', 'index', 'isEditing', 'isDragging', 'rowsLayout'],
    components: {
        FrameComponent,
        ResizeHandle
    },
    data() {
        return {
            initialPos: 0,
            frameIndex: 0,
            maxMoveSize: 0
        }
    },
    methods: {
        frameDragFrom(frameIndex) {
           this.$emit('frame-drag-from', this.index, frameIndex);
        },
        frameDropTo(frameIndex, event) {
            let domainObject = event.dataTransfer.getData('domainObject'),
                frameObject;

            if (domainObject) {
                frameObject = new Frame(JSON.parse(domainObject));
            }

            this.$emit('frame-drop-to', this.index, frameIndex, frameObject);
        },
        startFrameResizing(index) {
            let beforeFrame = this.frames[index],
                afterFrame = this.frames[index + 1];
            
            this.maxMoveSize = beforeFrame.height + afterFrame.height;
        },
        frameResizing(index, delta, event) {

            let percentageMoved = (delta / this.getElSize(this.$el))*100,
                beforeFrame = this.frames[index],
                afterFrame = this.frames[index + 1];

            beforeFrame.height = this.snapToPercentage(beforeFrame.height + percentageMoved);
            afterFrame.height = this.snapToPercentage(afterFrame.height - percentageMoved);
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
        promptBeforeDeletingFrame(frameIndex) {
            let deleteFrame = this.deleteFrame;

            let prompt = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: `This action will remove ${this.frames[frameIndex].domainObject.name} from this Flexible Layout. Do you want to continue?`,
                buttons: [
                    {
                        label: 'Ok',
                        emphasis: 'true',
                        callback: function () {
                            deleteFrame(frameIndex);
                            prompt.dismiss();
                        },
                    },
                    {
                        label: 'Cancel',
                        callback: function () {
                            prompt.dismiss();
                        }
                    }
                ]
            });
        },
        deleteFrame(frameIndex) {
            this.frames.splice(frameIndex, 1);
            this.$parent.recalculateOldFrameSize(this.frames);
            this.persist();
        },
        deleteContainer() {
            this.$emit('delete-container', this.index);
        },
        addContainer() {
            this.$emit('add-container', this.index);
        },
        startContainerDrag(event) {
            event.stopPropagation();
            this.$emit('start-container-drag', this.index);
        },
        stopContainerDrag(event) {
            event.stopPropagation();
            this.$emit('stop-container-drag');
        }
    },
    mounted() {
        let context = {
            item: this.domainObject,
            method: this.deleteContainer,
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
