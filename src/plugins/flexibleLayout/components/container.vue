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
         :style="[{'flex-basis': size}]">
        <div class="c-fl-container__header"
            v-if="isEditing">
            <span class="c-fl-container__label">{{ size }}</span>
        </div>
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
            @frame-resizing="frameResizing"
            @end-frame-resizing="endFrameResizing">
        </frame-component>
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-fl-container {
        display: flex;
        flex-direction: column; // Default
        align-content: stretch;
        align-items: stretch;
        justify-content: space-around;

        // flex-basis is set with inline style in code, controls size
        flex-grow: 1;
        flex-shrink: 1;

        > * + * {
            .c-fl-frame__drag-wrapper {
                border-top: 1px solid $colorInteriorBorder;
            }
        }

        .is-editing & {
            background: $editColorBg;

            .c-fl-frame__drag-wrapper {
              border-top: 1px dotted $editColor;
            }
        }

        &__header {
            background: rgba($editColor, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
        }

        .c-fl--rows & {
            // Layout is rows
            flex-direction: row;

            > * + * {
                .c-fl-frame__drag-wrapper {
                    border-top: none;
                    border-left: 1px solid $colorInteriorBorder;
                }
            }

            .is-editing & {
                > * + * {
                    .c-fl-frame__drag-wrapper {
                        border-left: 1px dotted $editColor;
                    }
                }

            }

            &__header {
                flex-basis: 20px;
                overflow: hidden;
            }

            &__label {
                transform-origin: center;
                transform: rotate(-90deg);
            }

            &__frames-holder {
                flex-direction: row;
            }
        }
    }

</style>

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
        frameResizing(index, delta) {
            let percentageMoved = (delta/this.getElHeight(this.$el))*100,
                beforeFrame = this.frames[index],
                afterFrame = this.frames[index + 1];

                beforeFrame.height = beforeFrame.height - percentageMoved;
                afterFrame.height = afterFrame.height + percentageMoved;
        },
        endFrameResizing(event) {
            this.persist();
        },
        getElHeight(el) {
            if (this.layoutDirectionStr === 'rows') {
                return el.offsetWidth;
            } else {
                return el.offsetHeight;
            }
        },
        persist() {
            this.$emit('persist', this.index);
        }
    }
}
</script>
