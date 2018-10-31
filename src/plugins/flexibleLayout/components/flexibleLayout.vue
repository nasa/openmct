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
                 @addFrame="addFrame"
                 @object-drag-from="dragFromHandler"
                 @object-drop-to="dropToHandler">
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
            flex: 1 1 100%;

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
            layoutDirectionStr: (this.rowsLayout === true)? 'columns' : 'rows'
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
        persist(){
            this.openmct.objects.mutate(this.domainObject, '.configuration.containers', this.containers);
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
            this.layoutDirectionStr = (this.rowsLayout === true)? 'rows' : 'columns';
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
