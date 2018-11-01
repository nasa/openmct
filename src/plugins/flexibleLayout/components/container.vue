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
            <span class="c-fl-container__label">{{ size }}</span>
        </div>
        <div class="c-fl-container__frames-holder">
            <frame-component
                class="c-fl-container__frame"
                v-for="(frame, index) in frames"
                :key="index"
                :style="{
                    'flex-basis': `${frame.height}%`
                }"
                :frame="frame"
                :index="index"
                :isEditing="isEditing"
                :isDragging="isDragging"
                :layoutDirectionStr="layoutDirectionStr"
                @object-drag-from="dragFrom"
                @object-drop-to="dropTo"
                @start-frame-resizing="startFrameResizing">
            </frame-component>
        </div>
    </div>
</template>

<script>
import FrameComponent from './frame.vue';
import Frame from '../utils/frame'

const SNAP_TO_PERCENTAGE = 5;

export default {
    inject:['openmct'],
    props: ['size', 'frames', 'index', 'isEditing', 'isDragging', 'layoutDirectionStr'],
    components: {
        FrameComponent
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
        mousemove(event) {
            let delta = this.initialPos - this.getPosition(event),
                percentageMoved = (delta/this.getElHeight(this.$el))*100,
                beforeFrame = this.frames[this.frameIndex],
                afterFrame = this.frames[this.frameIndex + 1];

                beforeFrame.height = beforeFrame.height - percentageMoved;
                afterFrame.height = afterFrame.height + percentageMoved;

                this.initialPos = this.getPosition(event);
        },
        mouseup(event) {
            this.persist();

            document.body.removeEventListener('mousemove', this.mousemove);
            document.body.removeEventListener('mouseup', this.mouseup);
        },
        getPosition(event) {
            if (this.layoutDirectionStr === 'rows') {
                return event.pageX;
            } else {
                return event.pageY;
            };
        },
        getElHeight(el) {
            if (this.layoutDirectionStr === 'rows') {
                return el.offsetWidth;
            } else {
                return el.offsetHeight;
            }
        },
        startFrameResizing(frameIndex, event) {
            this.initialPos = this.getPosition(event);
            this.frameIndex = frameIndex;

            document.body.addEventListener('mousemove', this.mousemove);
            document.body.addEventListener('mouseup', this.mouseup);
        },
        persist() {
            this.$emit('persist', this.index);
        }
    }
}
</script>
