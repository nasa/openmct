<template>
    <div class="c-fl">
        <div class="temp-toolbar"
             v-if="isEditing">
            <button class="c-button"
                    @click="addContainer">Add Container</button>
            <button class="c-button"
                    @click="toggleLayout">Toggle Layout</button>
            <span>Layout is {{ layoutDirectionStr }}</span>
        </div>

        <div
             v-if="containers.length === 1 && !containers[0].frames[1]">
            Click on EDIT and DRAG objects into your new Flexible Layout
        </div>

        <div class="c-fl__container-holder"
            :class="{
                'c-fl--rows': rowsLayout === true
            }">

            <div class="u-contents"
                 v-for="(container, index) in containers"
                 :key="index">
                <container-component
                    class="c-fl__container"
                    :index="index"
                    :size="`${Math.round(container.width)}%`"
                    :frames="container.frames"
                    :isEditing="isEditing"
                    :isDragging="isDragging"
                    :layoutDirectionStr="layoutDirectionStr"
                    @addFrame="addFrame"
                    @object-drag-from="dragFromHandler"
                    @object-drop-to="dropToHandler"
                    @persist="persist">
                </container-component>

                <resize-handle
                    v-if="index !== (containers.length - 1)"
                    v-show="isEditing"
                    :index="index"
                    :orientation="layoutDirectionStr === 'rows' ? 'vertical' : 'horizontal'"
                    @mousedown="startContainerResizing"
                    @mousemove="containerResizing"
                    @mouseup="endContainerResizing">
                </resize-handle>
            </div>
        </div> 
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-fl {
        @include abs();
        display: flex;
        flex-direction: column; // TEMP: only needed to support temp-toolbar element

        > * + * {  margin-top: $interiorMargin; }

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
                //@include test(blue, 0.1);
                flex-direction: column;
                > * + * {
                    margin-left: 0;
                    margin-top: 1px;
                }
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

        .is-editing & {
            background: $editColorBg;
        }

        &__header {
            background: rgba($editColor, 0.3);
            display: flex;
            align-items: center;
            flex: 0 0 $headerSize;

            &:before {
                // Drag grippy
                content: $glyph-icon-list-view;
                font-size: 0.8em;
                opacity: 0.5;
                position: absolute;
                left: 50%; top: 50%;
                transform-origin: center;
                transform: rotate(90deg) translate(-50%, 50%);
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

        /****** THEIR FRAMES */
        // Frames get styled here because this is particular to their presence in this layout type
        .c-fl-frame {
            @include browserPrefix(margin-collapse, collapse);
            margin: 1px;

            &__drag-wrapper {
                border: 1px solid $colorInteriorBorder;
            }
        }

        /****** ROWS LAYOUT */
        .c-fl--rows & {
            // Layout is rows
            flex-direction: row;

            &__header {
                flex-basis: $headerSize;
                overflow: hidden;

                &:before {
                    // Drag grippy
                    transform: rotate(0) translate(-50%, -50%);
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
        $sizeIndicatorM: 16px;

        display: flex;
        justify-content: stretch;
        align-items: stretch;
        flex: 1 1;
        flex-direction: column;
        overflow: hidden; // Needed to allow frames to collapse

        &__drag-wrapper {
            flex: 1 1 auto;
            overflow: auto;
        }

        &__size-indicator {
            $size: 35px;

            @include ellipsize();
            background: $colorBtnBg;
            border-top-left-radius: $controlCr;
            box-shadow: rgba(black, 0.3) 0 -1px 2px;
            color: $colorBtnFg;
            display: inline-block;
            padding: $interiorMarginSm 0;
            position: absolute;
            pointer-events: none;
            text-align: center;
            width: $size;
            z-index: 2;

            // Changed when layout is different, see below
            border-top-right-radius: $controlCr;
            bottom: 1px;
            right: $sizeIndicatorM;
        }

        &__drop-hint {
            /* TODO: make this independent of the flex-basis of .c-fl-frame
             * so that the first-in-container element can be set to basis 0;
             */
            flex: 0 0 15px;
            .c-drop-hint {
                border-radius: $smallCr;
            }
        }

        &__resize-handle {
            $size: 2px;
            $margin: 3px;
            $marginHov: 0;

            display: flex;
            flex-direction: column;
            flex: 0 0 ($margin * 2) + $size;
            transition: $transOut;

            &:before {
                content: '';
                display: block;
                flex: 1 1 auto;
                min-height: $size; min-width: $size;
                background: rgba($editColor, 0.6);
            }

            &.vertical {
                padding: $margin 0;
                &:hover{
                  //  padding: $marginHov 0;
                    cursor: row-resize;
                }
            }

            &.horizontal {
                padding: 0 $margin;
                &:hover{
                 //   padding: 0 $marginHov;
                    cursor: col-resize;
                }
            }

            &:hover {
                transition: $transOut;
                &:before {
                    background: $editColor;
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
                box-shadow: rgba(black, 0.3) -1px 0 5px;
                right: 1px;
            }
        }


        &--first-in-container {
            border: none;
            flex: 0 0 0;
            .c-fl-frame__drag-wrapper {
                display: none;
            }
        }

        .is-empty & {
            &.c-fl-frame--first-in-container {
                flex: 1 1 auto;
            }

            &__drop-hint {
                flex: 1 1 100%;
            }
        }
    }

    [s-selected] {
        border: $browseBorderSelected
    }

</style>

<script>
import ContainerComponent  from './container.vue';
import Container from '../utils/container';
import ResizeHandle from  './resizeHandle.vue';

const SNAP_TO_PERCENTAGE = 1,
      MIN_CONTAINER_SIZE = 5;

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        ContainerComponent,
        ResizeHandle
    },
    data() {
        let containers = this.domainObject.configuration.containers;

        if (!containers.length) {
            containers = [new Container(100)];
        }

        return {
            containers: containers,
            dragFrom: [],
            isEditing: false,
            isDragging: false,
            rowsLayout: false,
            layoutDirectionStr: 'columns',
            maxMoveSize: 0
        }
    },
    methods: {
        addContainer() {
            let newSize = 100/(this.containers.length+1);

            let container = new Container(newSize)

            this.recalculateContainerSize(newSize);

            this.containers.push(container);
        },
        recalculateContainerSize(newSize) {
            this.containers.forEach((container) => {
                container.width = newSize;
            });
        },
        addFrame(frame, index) {
            this.containers[index].addFrame(frame);
        },
        dragFromHandler(containerIndex, frameIndex) {
            this.dragFrom = [containerIndex, frameIndex];
        },
        dropToHandler(containerIndex, frameIndex, frameObject) {
            this.isDragging = false;

            if (!frameObject) {
                frameObject = this.containers[this.dragFrom[0]].frames.splice(this.dragFrom[1], 1)[0];
            }

            this.containers[containerIndex].frames.splice((frameIndex + 1), 0, frameObject);

            this.persist();
        },
        persist(index){
            if (index) {
                this.openmct.objects.mutate(this.domainObject, `.configuration.containers[${index}]`, this.containers[index]);
            } else {
                this.openmct.objects.mutate(this.domainObject, '.configuration.containers', this.containers);
            }
        },
        isEditingHandler(isEditing) {
            this.isEditing = isEditing;
            
            if (this.isDragging && isEditing === false) {
                this.isDragging = false;
            }
        },
        dragstartHandler() {
            if (this.isEditing) {
                this.isDragging = true;
            }
        },
        dragendHandler() {
            this.isDragging = false;
        },
        toggleLayout() {
            this.rowsLayout = !this.rowsLayout;
            this.layoutDirectionStr = (this.rowsLayout === true) ? 'rows' : 'columns';
        },
        startContainerResizing(index) {
            let beforeContainer = this.containers[index],
                afterContainer = this.containers[index + 1];

            this.maxMoveSize = beforeContainer.width + afterContainer.width;
        },
        containerResizing(index, delta, event) {
            let percentageMoved = (delta/this.getElSize(this.$el))*100,
                beforeContainer = this.containers[index],
                afterContainer = this.containers[index + 1];

                beforeContainer.width = this.snapToPercentage(beforeContainer.width + percentageMoved);
                afterContainer.width = this.snapToPercentage(afterContainer.width - percentageMoved);
        },
        endContainerResizing(event) {
            this.persist();
        },
        getElSize(el) {
            if (this.layoutDirectionStr === 'rows') {
                return el.offsetHeight;
            } else {
                return el.offsetWidth;
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
        snapToPercentage(value) {
            let rem = value % SNAP_TO_PERCENTAGE,
                roundedValue;
            
            if (rem < 0.5) {
                 roundedValue = Math.floor(value/SNAP_TO_PERCENTAGE)*SNAP_TO_PERCENTAGE;
            } else {
                roundedValue = Math.ceil(value/SNAP_TO_PERCENTAGE)*SNAP_TO_PERCENTAGE;
            }

            return this.getContainerSize(roundedValue);
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.isEditingHandler);
        document.addEventListener('dragstart', this.dragstartHandler);
        document.addEventListener('dragend', this.dragendHandler);
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.isEditingHandler);
        document.removeEventListener('dragstart', this.dragstartHandler);
        document.removeEventListener('dragend', this.dragendHandler);
    }
}
</script>
