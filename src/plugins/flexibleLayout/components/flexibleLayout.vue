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
    <div class="c-fl">
        <div 
            id="js-fl-drag-ghost"
            class="c-fl__drag-ghost">
        </div>

        <div class="c-fl__empty"
             v-if="areAllContainersEmpty()">
            <span class="c-fl__empty-message">This Flexible Layout is currently empty</span>
        </div>

        <div class="c-fl__container-holder"
            :class="{
                'c-fl--rows': rowsLayout === true
            }">

            <template v-for="(container, index) in containers">

                <drop-hint
                    class="c-fl-frame__drop-hint"
                    v-if="index === 0 && containers.length > 1"
                    :key="index"
                    :index="-1"
                    :allow-drop="allowContainerDrop"
                    @object-drop-to="moveContainer">
                </drop-hint>

                <container-component
                    class="c-fl__container"
                    :key="container.id"
                    :index="index"
                    :container="container"
                    :rowsLayout="rowsLayout"
                    :isEditing="isEditing"
                    @move-frame="moveFrame"
                    @new-frame="setFrameLocation"
                    @persist="persist">
                </container-component>

                <resize-handle
                    v-if="index !== (containers.length - 1)"
                    :key="index"
                    :index="index"
                    :orientation="rowsLayout ? 'vertical' : 'horizontal'"
                    :isEditing="isEditing"
                    @init-move="startContainerResizing"
                    @move="containerResizing"
                    @end-move="endContainerResizing">
                </resize-handle>

                <drop-hint
                    class="c-fl-frame__drop-hint"
                    v-if="containers.length > 1"
                    :key="index"
                    :index="index"
                    :allowDrop="allowContainerDrop"
                    @object-drop-to="moveContainer">
                </drop-hint>
            </template>
        </div>
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';
    
    @mixin containerGrippy($headerSize, $dir) {
        position: absolute;
        $h: 6px;
        $minorOffset: ($headerSize - $h) / 2;
        $majorOffset: 35%;
        content: '';
        display: block;
        position: absolute;
        @include grippy($c: $editFrameSelectedMovebarColorFg, $dir: $dir);
        @if $dir == 'x' {
            top: $minorOffset; right: $majorOffset; bottom: $minorOffset; left: $majorOffset;
        } @else {
            top: $majorOffset; right: $minorOffset; bottom: $majorOffset; left: $minorOffset;
        }
    }

    .c-fl {
        @include abs();
        display: flex;

        .temp-toolbar {
            flex: 0 0 auto;
        }

        &__container-holder {
            display: flex;
            flex: 1 1 100%; // Must needs to be 100% to work

            // Columns by default
            flex-direction: row;
            > * + * { margin-left: 1px; }

            &[class*='--rows'] {
                flex-direction: column;
                > * + * {
                    margin-left: 0;
                    margin-top: 1px;
                }
            }
        }

        &__empty {
            @include abs();
            background: rgba($colorBodyFg, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;

            > * {
                font-style: italic;
                opacity: 0.5;
            }
        }

        &__drag-ghost{
            background: $colorItemTreeHoverBg;
            color: $colorItemTreeHoverFg;
            border-radius: $basicCr;
            display: flex;
            align-items: center;
            padding: $interiorMarginLg $interiorMarginLg * 2;
            position: absolute;
            top: -10000px;
            z-index: 2;

            &:before {
                color: $colorKey;
                margin-right: $interiorMarginSm;
            }
        }
    }

    .c-fl-container {
        /***************************************************** CONTAINERS */
        $headerSize: 16px;

        display: flex;
        flex-direction: column;
        overflow: auto;

        // flex-basis is set with inline style in code, controls size
        flex-grow: 1;
        flex-shrink: 1;

        &__header {
            // Only displayed when editing, controlled via JS
            background: $editFrameMovebarColorBg;
            color: $editFrameMovebarColorFg;
            cursor: move;
            display: flex;
            align-items: center;
            flex: 0 0 $headerSize;

            &:before {
                // Drag grippy
                @include containerGrippy($headerSize, 'x');
                opacity: 0.5;
            }
        }

        &__size-indicator {
            position: absolute;
            display: inline-block;
            right: $interiorMargin;
        }

        &__frames-holder {
            display: flex;
            flex: 1 1 100%; // Must be 100% to work
            flex-direction: column; // Default
            align-content: stretch;
            align-items: stretch;
            overflow: hidden; // This sucks, but doing in the short-term
        }

        .is-editing & {
            &:hover {
                .c-fl-container__header {
                    background: $editFrameHovMovebarColorBg;
                    color: $editFrameHovMovebarColorFg;

                    &:before {
                        opacity: .75;
                    }
                }
            }

            &[s-selected] {
                border: $editFrameSelectedBorder;

                .c-fl-container__header {
                    background:$editFrameSelectedMovebarColorBg;
                    color: $editFrameSelectedMovebarColorFg;
                    &:before {
                        // Grippy
                        opacity: 1;
                    }
                }
            }
        }

        /****** THEIR FRAMES */
        // Frames get styled here because this is particular to their presence in this layout type
        .c-fl-frame {
            @include browserPrefix(margin-collapse, collapse);
        }

        /****** ROWS LAYOUT */
        .c-fl--rows & {
            // Layout is rows
            flex-direction: row;

            &__header {
                flex-basis: $headerSize;
                overflow: hidden;

                &:before {
                    // Grippy
                    @include containerGrippy($headerSize, 'y');
                }
            }

            &__size-indicator {
                right: 0;
                top: $interiorMargin;
                transform-origin: top right;
                transform: rotate(-90deg) translateY(-100%);
            }

            &__frames-holder {
                flex-direction: row;
            }
        }
    }

    .c-fl-frame {
        /***************************************************** CONTAINER FRAMES */
        $sizeIndicatorM: 16px;
        $dropHintSize: 15px;

        display: flex;
        flex: 1 1;
        flex-direction: column;
        overflow: hidden; // Needed to allow frames to collapse when sized down

        &__drag-wrapper {
            flex: 1 1 auto;
            overflow: auto;

            .is-editing & {
                > * {
                    pointer-events: none;
                }
            }
        }

        &__header {
            flex: 0 0 auto;
            margin-bottom: $interiorMargin;
        }

        &__size-indicator {
            $size: 35px;

            @include ellipsize();
            background: $colorBtnBg;
            border-top-left-radius: $controlCr;
            color: $colorBtnFg;
            display: inline-block;
            padding: $interiorMarginSm 0;
            position: absolute;
            pointer-events: none;
            text-align: center;
            width: $size;

            // Changed when layout is different, see below
            border-top-right-radius: $controlCr;
            bottom: 1px;
            right: $sizeIndicatorM;
        }

        &__drop-hint {
            flex: 0 0 $dropHintSize;
            .c-drop-hint {
                border-radius: $smallCr;
            }
        }

        &__resize-handle {
            $size: 2px;
            $margin: 3px;
            $marginHov: 0;
            $grippyThickness: $size + 6;
            $grippyLen: $grippyThickness * 2;

            display: flex;
            flex-direction: column;
            flex: 0 0 ($margin * 2) + $size;
            transition: $transOut;

            &:before {
                // The visible resize line
                background: $editUIColor;
                content: '';
                display: block;
                flex: 1 1 auto;
                min-height: $size; min-width: $size;
            }

            &.vertical {
                padding: $margin $size;
                &:hover{
                    cursor: row-resize;
                }
            }

            &.horizontal {
                padding: $size $margin;
                &:hover{
                    cursor: col-resize;
                }
            }

            &:hover {
                transition: $transOut;
                &:before {
                    // The visible resize line
                    background: $editUIColorHov;
                }
            }
        }

        // Hide the resize-handles in first and last c-fl-frame elements
        &:first-child,
        &:last-child {
            .c-fl-frame__resize-handle {
                display: none;
            }
        }

        .c-fl--rows & {
            flex-direction: row;

            &__size-indicator {
                border-bottom-left-radius: $controlCr;
                border-top-right-radius: 0;
                bottom: $sizeIndicatorM;
                right: 1px;
            }
        }

        &--first-in-container {
            border: none;
            flex: 0 0 0;
            .c-fl-frame__drag-wrapper {
                display: none;
            }

            &.is-dragging {
                flex-basis: $dropHintSize;
            }
        }

        .is-empty & {
            &.c-fl-frame--first-in-container {
                flex: 1 1 auto;
            }

            &__drop-hint {
                flex: 1 0 100%;
                margin: 0;
            }
        }

        .c-object-view {
            display: contents;
        }
    }
</style>

<script>
import ContainerComponent  from './container.vue';
import Container from '../utils/container';
import Frame from '../utils/frame';
import ResizeHandle from  './resizeHandle.vue';
import DropHint from './dropHint.vue';

const MIN_CONTAINER_SIZE = 5;

// Resize items so that newItem fits proportionally (newItem must be an element
// of items).  If newItem does not have a size or is sized at 100%, newItem will
// have size set to 1/n * 100, where n is the total number of items.
function sizeItems(items, newItem) {
    if (items.length === 1) {
        newItem.size = 100;
    } else {
        if (!newItem.size || newItem.size === 100) {
            newItem.size = Math.round(100 / items.length);
        }
        let oldItems = items.filter(item => item !== newItem);
        // Resize oldItems to fit inside remaining space;
        let remainder = 100 - newItem.size;
        oldItems.forEach((item) => {
            item.size = Math.round(item.size * remainder / 100);
        });
        // Ensure items add up to 100 in case of rounding error.
        let total = items.reduce((t, item) => t + item.size, 0);
        let excess = Math.round(100 - total);
        oldItems[oldItems.length - 1].size += excess;
    }
}

// Scales items proportionally so total is equal to 100.  Assumes that an item
// was removed from array.
function sizeToFill(items) {
    if (items.length === 0) {
        return;
    }
    let oldTotal = items.reduce((total, item) => total + item.size, 0);
    items.forEach((item) => {
        item.size = Math.round(item.size * 100 / oldTotal);
    });
    // Ensure items add up to 100 in case of rounding error.
    let total = items.reduce((t, item) => t + item.size, 0);
    let excess = Math.round(100 - total);
    items[items.length - 1].size += excess;
}

export default {
    inject: ['openmct', 'layoutObject'],
    components: {
        ContainerComponent,
        ResizeHandle,
        DropHint
    },
    data() {
        return {
            domainObject: this.layoutObject,
            newFrameLocation: []
        }
    },
    props: {
        isEditing: Boolean
    },
    computed: {
        layoutDirectionStr() {
            if (this.rowsLayout) {
                return 'Rows'
            } else {
                return 'Columns'
            }
        },
        containers() {
            return this.domainObject.configuration.containers;
        },
        rowsLayout() {
            return this.domainObject.configuration.rowsLayout;
        }
    },
    methods: {
        areAllContainersEmpty() {
            return !!!this.containers.filter(container => container.frames.length).length;
        },
        addContainer() {
            let container = new Container();
            this.containers.push(container);
            sizeItems(this.containers, container);
            this.persist();
        },
        deleteContainer(containerId) {
            let container = this.containers.filter(c => c.id === containerId)[0],
                containerIndex = this.containers.indexOf(container);

            /*
                remove associated domainObjects from composition
            */
            container.frames.forEach(f => {
                this.composition.remove({identifier: f.domainObjectIdentifier});
            });

            this.containers.splice(containerIndex, 1);

            /*
                add a container when there are no containers in the FL,
                to prevent user from not being able to add a frame via
                drag and drop. 
            */
            if (this.containers.length === 0) {
                this.containers.push(new Container(100));
            }

            sizeToFill(this.containers);
            this.persist();
        },
        moveFrame(toContainerIndex, toFrameIndex, frameId, fromContainerIndex) {
            let toContainer = this.containers[toContainerIndex];
            let fromContainer = this.containers[fromContainerIndex];
            let frame = fromContainer.frames.filter(f => f.id === frameId)[0];
            let fromIndex = fromContainer.frames.indexOf(frame);
            fromContainer.frames.splice(fromIndex, 1);
            sizeToFill(fromContainer.frames);
            toContainer.frames.splice(toFrameIndex + 1, 0, frame);
            sizeItems(toContainer.frames, frame);
            this.persist();
        },
        setFrameLocation(containerIndex, insertFrameIndex) {
            this.newFrameLocation = [containerIndex, insertFrameIndex];
        },
        addFrame(domainObject) {
            if (this.newFrameLocation.length) {
                let containerIndex = this.newFrameLocation[0],
                    frameIndex = this.newFrameLocation[1],
                    frame = new Frame(domainObject.identifier),
                    container = this.containers[containerIndex];

                container.frames.splice(frameIndex + 1, 0, frame);
                sizeItems(container.frames, frame);

                this.newFrameLocation = [];
                this.persist(containerIndex);
            }
        },
        deleteFrame(frameId) {
            let container = this.containers
                .filter(c => c.frames.some(f => f.id === frameId))[0];
            let containerIndex = this.containers.indexOf(container);
            let frame = container
                .frames
                .filter((f => f.id === frameId))[0];
            let frameIndex = container.frames.indexOf(frame);

            /*
                remove associated domainObject from composition
            */
            this.composition.remove({identifier: frame.domainObjectIdentifier});

            container.frames.splice(frameIndex, 1);
            sizeToFill(container.frames);
            this.persist(containerIndex);
        },
        allowContainerDrop(event, index) {
            if (!event.dataTransfer.types.includes('containerid')) {
                return false;
            }

            let containerId = event.dataTransfer.getData('containerid'),
                container = this.containers.filter((c) => c.id === containerId)[0],
                containerPos = this.containers.indexOf(container);

            if (index === -1) {
                return containerPos !== 0;
            } else {
                return containerPos !== index && (containerPos - 1) !== index
            }
        },
        persist(index){
            if (index) {
                this.openmct.objects.mutate(this.domainObject, `configuration.containers[${index}]`, this.containers[index]);
            } else {
                this.openmct.objects.mutate(this.domainObject, 'configuration.containers', this.containers);
            }
        },
        startContainerResizing(index) {
            let beforeContainer = this.containers[index],
                afterContainer = this.containers[index + 1];

            this.maxMoveSize = beforeContainer.size + afterContainer.size;
        },
        containerResizing(index, delta, event) {
            let percentageMoved = Math.round(delta / this.getElSize() * 100),
                beforeContainer = this.containers[index],
                afterContainer = this.containers[index + 1];

            beforeContainer.size = this.getContainerSize(beforeContainer.size + percentageMoved);
            afterContainer.size = this.getContainerSize(afterContainer.size - percentageMoved);
        },
        endContainerResizing(event) {
            this.persist();
        },
        getElSize() {
            if (this.rowsLayout) {
                return this.$el.offsetHeight;
            } else {
                return this.$el.offsetWidth;
            }
        },
        getContainerSize(size) {
            if (size < MIN_CONTAINER_SIZE) {
                return MIN_CONTAINER_SIZE
            } else if (size > (this.maxMoveSize - MIN_CONTAINER_SIZE)) {
                return (this.maxMoveSize - MIN_CONTAINER_SIZE);
            } else {
                return size;
            }
        },
        updateDomainObject(newDomainObject) {
            this.domainObject = newDomainObject;
        },
        moveContainer(toIndex, event) {
            let containerId = event.dataTransfer.getData('containerid');
            let container = this.containers.filter(c => c.id === containerId)[0];
            let fromIndex = this.containers.indexOf(container);
            this.containers.splice(fromIndex, 1);
            if (fromIndex > toIndex) {
                this.containers.splice(toIndex + 1, 0, container);
            } else {
                this.containers.splice(toIndex, 0, container);
            }
            this.persist();
        },
        removeChildObject(identifier) {
            let removeIdentifier = this.openmct.objects.makeKeyString(identifier);

            this.containers.forEach(container => {
                container.frames = container.frames.filter(frame => {
                    let frameIdentifier = this.openmct.objects.makeKeyString(frame.domainObjectIdentifier);
                    
                    return removeIdentifier !== frameIdentifier;
                });
            });

            this.persist();
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('remove', this.removeChildObject);
        this.composition.on('add', this.addFrame);

        this.unobserve = this.openmct.objects.observe(this.domainObject, '*', this.updateDomainObject);
    },
    beforeDestroy() {
        this.composition.off('remove', this.removeChildObject);
        this.composition.off('add', this.addFrame);

        this.unobserve();
    }
}
</script>
