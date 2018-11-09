<template>
    <div class="c-fl">
        <div class="c-fl__empty"
             v-if="areAllContainersEmpty()">
            <span class="c-fl__empty-message">This Flexible Layout is currently empty</span>
        </div>

        <div class="c-fl__container-holder"
            :class="{
                'c-fl--rows': rowsLayout === true
            }">

            <div class="u-contents"
                 v-for="(container, index) in containers"
                 :key="index">
                
                <drop-hint
                    style="flex-basis: 15px;"
                    v-if="index === 0 && containers.length > 1"
                    v-show="isContainerDragging"
                    :index="-1"
                    @object-drop-to="containerDropTo">
                </drop-hint>

                <container-component
                    class="c-fl__container"
                    ref="containerComponent"
                    :index="index"
                    :size="`${Math.round(container.width)}%`"
                    :frames="container.frames"
                    :isEditing="isEditing"
                    :isDragging="isDragging"
                    :rowsLayout="rowsLayout"
                    @addFrame="addFrame"
                    @frame-drag-from="frameDragFromHandler"
                    @frame-drop-to="frameDropToHandler"
                    @persist="persist"
                    @delete-container="promptBeforeDeletingContainer"
                    @add-container="addContainer"
                    @start-container-drag="startContainerDrag"
                    @stop-container-drag="stopContainerDrag">
                </container-component>

                <resize-handle
                    v-if="index !== (containers.length - 1)"
                    v-show="isEditing"
                    :index="index"
                    :orientation="rowsLayout ? 'vertical' : 'horizontal'"
                    @init-move="startContainerResizing"
                    @move="containerResizing"
                    @end-move="endContainerResizing">
                </resize-handle>

                <drop-hint
                    style="flex-basis: 15px;"
                    v-if="containers.length > 1"
                    v-show="isContainerDragging"
                    :index="index"
                    @object-drop-to="containerDropTo">
                </drop-hint>
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
    }

    .c-fl-container {
        /***************************************************** CONTAINERS */
        $headerSize: 16px;

        border: 1px solid transparent;
        display: flex;
        flex-direction: column;
        overflow: auto;

        // flex-basis is set with inline style in code, controls size
        flex-grow: 1;
        flex-shrink: 1;

        &__header {
            // Only displayed when editing
            background: $editSelectableColor;
            color: $editSelectableColorFg;
            cursor: move;
            display: flex;
            align-items: center;
            flex: 0 0 $headerSize;

            &:before {
                // Drag grippy
                font-size: 0.8em;
                opacity: 0.5;
                position: absolute;
                left: 50%; top: 50%;
                transform-origin: center;
                transform: translate(-50%, -50%);
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
            //background: $editCanvasColorBg;
            border-color: $editSelectableColor;

            &:hover {
                border-color: $editSelectableColorHov;
            }

            &[s-selected] {
                border-color: $editSelectableColorSelected;

                .c-fl-container__header {
                    background: $editSelectableColorSelected;
                    color: $editSelectableColorSelectedFg;
                }
            }
        }

        /****** THEIR FRAMES */
        // Frames get styled here because this is particular to their presence in this layout type
        .c-fl-frame {
            @include browserPrefix(margin-collapse, collapse);
            margin: 1px;

            //&__drag-wrapper {
                // border: 1px solid $colorInteriorBorder; // Now handled by is-selectable
            //}
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
                    transform: rotate(90deg) translate(-50%, 50%);
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
        $dropHintSize: 15px;

        display: flex;
        justify-content: stretch;
        align-items: stretch;
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
            z-index: 2;

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
                background: $editColor;
                content: '';
                display: block;
                flex: 1 1 auto;
                min-height: $size; min-width: $size;
            }

            &:after {
                // Grippy element
                /*background: deeppink;*/
                $c: black;
                $a: 0.9;
                $d: 5px;
                background: $editColor;
                color: $editColorBg;
                border-radius: $smallCr;
                content: $glyph-icon-grippy-ew;
                font-family: symbolsfont;
                font-size: 0.8em;
                display: inline-block;
                padding: 10px 0;
                position: absolute;
                left: 50%; top: 50%;
                text-align: center;
                transform-origin: center center;
                transform: translate(-50%, -50%);
                z-index: 10;
            }

            &.vertical {
                padding: $margin $size;
                &:hover{
                  //  padding: $marginHov 0;
                    cursor: row-resize;
                }

                &:after {
                    transform: rotate(90deg) translate(-50%, -50%);
                    //top: $margin + $size - 2px;
                    //left: 50%;
                   // transform: translateX(-50%);
                    /*width: $grippyLen;
                    height: $grippyThickness;*/
                }
            }

            &.horizontal {
                padding: $size $margin;
                &:hover{
                 //   padding: 0 $marginHov;
                    cursor: col-resize;
                }

                &:after {
                    //left: $margin + $size - 2px;
                    //top: 50%;
                    //transform: translateY(-50%);
                   /* height: $grippyLen;
                    width: $grippyThickness;*/
                }
            }

            &:hover {
                transition: $transOut;
                &:before {
                    // The visible resize line
                    background: $editColorHov;
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
                flex: 1 1 100%;
                margin: 0;
            }
        }
    }
</style>

<script>
import ContainerComponent  from './container.vue';
import Container from '../utils/container';
import ResizeHandle from  './resizeHandle.vue';
import DropHint from './dropHint.vue';

const SNAP_TO_PERCENTAGE = 1,
      MIN_CONTAINER_SIZE = 5;

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        ContainerComponent,
        ResizeHandle,
        DropHint
    },
    data() {
        let containers = this.domainObject.configuration.containers,
            rowsLayout = this.domainObject.configuration.rowsLayout;

        return {
            containers: containers,
            dragFrom: [],
            isEditing: false,
            isDragging: false,
            isContainerDragging: false,
            rowsLayout: rowsLayout,
            maxMoveSize: 0
        }
    },
    computed: {
        layoutDirectionStr() {
            if (this.rowsLayout) {
                return 'Rows'
            } else {
                return 'Columns'
            }
        }
    },
    methods: {
        areAllContainersEmpty() {
            return !!!this.containers.filter(container => container.frames.length > 1).length;
        },
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
        recalculateNewFrameSize(multFactor, framesArray){
            framesArray.forEach((frame, index) => {
                if (index === 0) {
                    return;
                }
                let frameSize = frame.height
                frame.height = this.snapToPercentage(multFactor * frameSize);
            });
        },
        recalculateOldFrameSize(framesArray) {
            let totalRemainingSum = framesArray.map((frame,i) => {
                if (i !== 0) {
                    return frame.height
                } else {
                    return 0;
                }
            }).reduce((a, c) => a + c);

            framesArray.forEach((frame, index) => {

                if (index === 0) {
                    return;
                }
                if (framesArray.length === 2) {

                    frame.height = 100;
                } else {

                    let newSize = frame.height + ((frame.height / totalRemainingSum) * (100 - totalRemainingSum));
                    frame.height = this.snapToPercentage(newSize);
                }
            });
        },
        addFrame(frame, index) {
            this.containers[index].addFrame(frame);
        },
        frameDragFromHandler(containerIndex, frameIndex) {
            this.dragFrom = [containerIndex, frameIndex];
        },
        frameDropToHandler(containerIndex, frameIndex, frameObject) {
            let newContainer = this.containers[containerIndex];

            this.isDragging = false;

            if (!frameObject) {
                frameObject = this.containers[this.dragFrom[0]].frames.splice(this.dragFrom[1], 1)[0];
                this.recalculateOldFrameSize(this.containers[this.dragFrom[0]].frames);
            }

            if (!frameObject.height) {
                frameObject.height = 100 / Math.max(newContainer.frames.length - 1, 1);
            }

            newContainer.frames.splice((frameIndex + 1), 0, frameObject);

            let newTotalHeight = newContainer.frames.reduce((total, frame) => {
                        let num = Number(frame.height);

                        if(isNaN(num)) {
                            return total;
                        } else {
                            return total + num;
                        }
                    },0);
            let newMultFactor = 100 / newTotalHeight;

            this.recalculateNewFrameSize(newMultFactor, newContainer.frames);

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

            if (this.isEditing) {
                this.$el.click(); //force selection of flexible-layout for toolbar
            }

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
        startContainerResizing(index) {
            let beforeContainer = this.containers[index],
                afterContainer = this.containers[index + 1];

            this.maxMoveSize = beforeContainer.width + afterContainer.width;
        },
        containerResizing(index, delta, event) {
            let percentageMoved = (delta/this.getElSize(this.$el))*100,
                beforeContainer = this.containers[index],
                afterContainer = this.containers[index + 1];

                beforeContainer.width = this.getContainerSize(this.snapToPercentage(beforeContainer.width + percentageMoved));
                afterContainer.width = this.getContainerSize(this.snapToPercentage(afterContainer.width - percentageMoved));
        },
        endContainerResizing(event) {
            this.persist();
        },
        getElSize(el) {
            if (this.rowsLayout) {
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

            return roundedValue;
        },
        toggleLayoutDirection(v) {
            this.rowsLayout = v;
        },
        promptBeforeDeletingContainer(containerIndex) {
            let deleteContainer = this.deleteContainer;

            let prompt = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: `This action will permanently delete container ${containerIndex + 1} from this Flexible Layout`,
                buttons: [
                    {
                        label: 'Ok',
                        emphasis: 'true',
                        callback: function () {
                            deleteContainer(containerIndex);
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
        deleteContainer(containerIndex) {
            this.containers.splice(containerIndex, 1);

            this.recalculateContainerSize(100/this.containers.length);
            this.persist();
        },
        addContainer(containerIndex) {
            let newContainer = new Container();

            if (typeof containerIndex === 'number') {
                this.containers.splice(containerIndex+1, 0, newContainer);
            } else {

                this.containers.push(newContainer);
            }

            this.recalculateContainerSize(100/this.containers.length);
            this.persist();
        },
        startContainerDrag(index) {
            this.isContainerDragging = true;
            this.containerDragFrom = index;
        },
        stopContainerDrag() {
            this.isContainerDragging = false;
        },
        containerDropTo(event, index) {
            let fromContainer = this.containers.splice(this.containerDragFrom, 1)[0];

            if (index === -1) {
                this.containers.unshift(fromContainer);
            } else {
                this.containers.splice(index, 0, fromContainer);
            }

            this.persist();
        }
    },
    mounted() {

        let context = {
            item: this.domainObject,
            addContainer: this.addContainer,
            type: 'flexible-layout'
        }

        this.unsubscribeSelection = this.openmct.selection.selectable(this.$el, context, true);

        this.openmct.objects.observe(this.domainObject, 'configuration.rowsLayout', this.toggleLayoutDirection);
        this.openmct.editor.on('isEditing', this.isEditingHandler);

        document.addEventListener('dragstart', this.dragstartHandler);
        document.addEventListener('dragend', this.dragendHandler);
    },
    beforeDestroy() {
        this.unsubscribeSelection();

        this.openmct.editor.off('isEditing', this.isEditingHandler);
        document.removeEventListener('dragstart', this.dragstartHandler);
        document.removeEventListener('dragend', this.dragendHandler);
    }
}
</script>
