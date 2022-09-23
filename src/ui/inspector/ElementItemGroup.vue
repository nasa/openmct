/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
<div
    @dragenter.stop="onDragEnter"
    @dragleave.stop="onDragLeave"
    @dragover.prevent="onDragover"
    @dragstart="onDragStart"
    @drop="drop"
>
    <ul>
        <div
            class="c-tree__item c-elements-pool__group"
            :class="{
                'hover': hover
            }"
        >
            <!-- <span class="c-elements-pool__grippy c-grippy c-grippy--vertical-drag"></span> -->
            <div
                class="c-tree__item__type-icon c-object-label__type-icon"
            >
                <span
                    class="is-status__indicator"
                ></span>
            </div>
            <div class="c-tree__item__name c-object-label__name">
                {{ label }}
            </div>
        </div>
        <element-item
            v-for="(element, index) in elements"
            :key="element.identifier.key"
            :index="index"
            :element-object="element"
            :parent-object="parentObject"
            :allow-drop="allowDrop"
            @dragstart-custom="moveFrom(index)"
            @drop-custom="moveTo(index)"
        />
        <li
            class="js-last-place"
            @drop="moveToIndex(elements.length)"
        ></li>
    </ul>
</div>
</template>

<script>
import ElementItem from "./ElementItem.vue";
export default {
    components: {
        ElementItem
    },
    props: {
        elements: {
            type: Array,
            required: false,
            default: () => {
                return [];
            }
        },
        parentObject: {
            type: Object,
            required: true,
            default: () => {
                return {};
            }
        },
        label: {
            type: String,
            required: true,
            default: () => {
                return '';
            }
        }
    },
    data() {
        return {
            allowDrop: true,
            hover: false
        };
    },
    methods: {
        onDragEnter(event) {
            // console.log('onDragEnter');
            if (this.allowDrop) {
                this.hover = true;
                this.dragElement = event.target.parentElement;
            }
        },
        onDragLeave(event) {
            if (event.target.parentElement === this.dragElement) {
                // console.log('onDragLeave');
                this.hover = false;
                delete this.dragElement;
            }
        },
        moveTo(moveToIndex) {
            if (this.allowDrop) {
                console.log('moveToIndex', moveToIndex);
                // this.composition.reorder(this.moveFromIndex, moveToIndex);
                this.allowDrop = false;
            }
        },
        moveFrom(index) {
            console.log('moveFromIndex', index);
            this.allowDrop = true;
            this.moveFromIndex = index;
        },
        drop(event) {
            if (this.allowDrop) {
                console.log('we droppin boys', event.dataTransfer.getData('element'));
                this.hover = false;
                if (event.currentTarget !== event.target) {
                    this.elements.push(JSON.parse(event.dataTransfer.getData('element')));
                } else {
                    this.elements.splice(this.moveFromIndex, 1);
                }

            }
        },
        onDragStart(event) {
            event.dataTransfer.clearData();
            event.dataTransfer.setData('element', JSON.stringify(this.elements[this.moveFromIndex]));
        },
        onDragover(event) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
};
</script>
