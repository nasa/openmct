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
        <div class="c-fl-container__header"
            v-if="isEditing">
            <span class="c-fl-container__size-indicator">{{ size }}</span>
        </div>
        <div class="c-fl-container__frames-holder">
            <div class="u-contents"
                 v-for="(frame, index) in frames"
                 :key="index">

                <frame-component
                    class="c-fl-container__frame"
                    :style="{
                        'flex-basis': `${frame.height}%`
                    }"
                    :frame="frame"
                    :size="frame.height"
                    :index="index"
                    :isEditing="isEditing"
                    :isDragging="isDragging"
                    @object-drag-from="dragFrom"
                    @object-drop-to="dropTo">
                </frame-component>

                <resize-handle
                    v-if="index !== 0 && (index !== frames.length - 1)"
                    v-show="isEditing"
                    :index="index"
                    :orientation="layoutDirectionStr === 'rows' ? 'horizontal' : 'vertical'"
                    @mousemove="frameResizing"
                    @mouseup="endFrameResizing">
                </resize-handle>
            </div>
        </div>

    </div>
</template>

<script>
import FrameComponent from './frame.vue';
import Frame from '../utils/frame';
import ResizeHandle from './resizeHandle.vue';

const SNAP_TO_PERCENTAGE = 5;
const MIN_FRAME_SIZE = 10;

export default {
    inject:['openmct'],
    props: ['size', 'frames', 'index', 'isEditing', 'isDragging', 'layoutDirectionStr'],
    components: {
        FrameComponent,
        ResizeHandle
    },
    data() {
        return {
            initialPos: 0,
            frameIndex: 0
        }
    },
    methods: {
        framesResize(newSize) {
            this.frames.forEach((frame) => {
                if(!frame.cssClass) {
                    frame.height = newSize;
                }
            });
        },
        dragFrom(frameIndex) {
           this.$emit('object-drag-from', this.index, frameIndex);
        },
        dropTo(frameIndex, event) {
            let domainObject = event.dataTransfer.getData('domainObject'),
                frameObject;

            if (domainObject) {
                let newFrameSize = Math.round(100/(this.frames.length));

                this.framesResize(newFrameSize);

                frameObject = new Frame(JSON.parse(domainObject), newFrameSize);
            }

            this.$emit('object-drop-to', this.index, frameIndex, frameObject);
        },
        frameResizing(index, delta) {
            let percentageMoved = (delta/this.getElSize(this.$el))*100,
                beforeFrame = this.frames[index],
                afterFrame = this.frames[index + 1];

                beforeFrame.height = this.getFrameSize(beforeFrame.height - percentageMoved);
                afterFrame.height = this.getFrameSize(afterFrame.height + percentageMoved);
        },
        endFrameResizing(event) {
            this.persist();
        },
        getElSize(el) {
            if (this.layoutDirectionStr === 'rows') {
                return el.offsetWidth;
            } else {
                return el.offsetHeight;
            }
        },
        getFrameSize(size) {
            if (size < MIN_FRAME_SIZE) {
                return MIN_FRAME_SIZE
            } else if (size > (100 - MIN_FRAME_SIZE)) {
                return (100 - MIN_FRAME_SIZE);
            } else {
                return size;
            }
        },
        persist() {
            this.$emit('persist', this.index);
        }
    }
}
</script>
