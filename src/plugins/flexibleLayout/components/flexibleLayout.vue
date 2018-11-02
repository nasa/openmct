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
            <container-component
                class="c-fl__container"
                 v-for="(container, index) in containers"
                 :key="index"
                 :index="index"
                 :size="container.width || `${Math.round(100/containers.length)}%`"
                 :frames="container.frames"
                 :isEditing="isEditing"
                 :isDragging="isDragging"
                 :layoutDirectionStr="layoutDirectionStr"
                 @addFrame="addFrame"
                 @object-drag-from="dragFromHandler"
                 @object-drop-to="dropToHandler"
                 @persist="persist">
            </container-component>
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
            justify-content: center;
            flex: 0 0 auto;
        }

        &__frames-holder {
//            @include test($a: 0.6);
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

        /****** LAYOUT */
        .c-fl--rows & {
            // Layout is rows
            flex-direction: row;

            > * + * {
                .c-fl-frame__drag-wrapper {
                    // border-top: none;
                    // border-left: 1px solid $colorInteriorBorder;
                }
            }

            .is-editing & {
                > * + * {
                    .c-fl-frame__drag-wrapper {
                        //  border-left: 1px dotted $editColor;
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

    .c-fl-frame {
        display: flex;
        justify-content: stretch;
        align-items: stretch;
        flex: 1 1;
        flex-direction: column;

        &__drag-wrapper {
            flex: 1 1 auto;
            overflow: auto;
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
            $margin: 5px;
            $marginHov: 16px;

            &:before {
                content: '';
                //@include abs($margin);
                display: block;
                min-height: $size; min-width: $size;
                background: rgba($editColor, 0.6);
            }

            flex: 0 0 ($margin * 2) + $size;
            padding: $margin;

            &.vertical {
                &:hover{
                    cursor: row-resize;
                }
            }

            &.horizontal {
                &:hover{
                    cursor: col-resize;
                }
            }

            &:hover {
                //flex-basis: $marginHov * 2;
                // padding: 10px;
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

</style>

<script>
import ContainerComponent  from '../components/container.vue';
import Container from '../utils/container';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        ContainerComponent
    },
    data() {
        let containers = this.domainObject.configuration.containers;

        if (!containers.length) {
            containers = [new Container()];
        }

        return {
            containers: containers,
            dragFrom: [],
            isEditing: false,
            isDragging: false,
            rowsLayout: false,
            layoutDirectionStr: 'columns'
        }
    },
    methods: {
        addContainer() {
            let container = new Container()

            this.containers.push(container);
        },
        addFrame(frame, index) {
            this.containers[index].addFrame(frame);
        },
        dragFromHandler(containerIndex, frameIndex) {
            this.dragFrom = [containerIndex, frameIndex];
        },
        dropToHandler(containerIndex, frameIndex, frameObject) {
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
        document.addEventListener('dragend', this.dragendHandler);
    }
}
</script>
