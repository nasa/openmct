<template>
    <div class="flexible-layout-container">
        <div class="header" 
             v-if="isEditing"
             @click="addContainer">
            Add a new Container
        </div>

        <div
             v-if="containers.length === 1 && !containers[0].frames[1]">
            Click on EDIT and DRAG objects into your new Flexible Layout
        </div>

        <div class="body">
            <container-component
                 v-for="(container, index) in containers"
                 :key="index"
                 :index="index"
                 :minWidth="container.width || `${100/containers.length}%`"
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

    .l-fl {
        @include abs();
        display: flex;
        flex-direction: column;
        .header {
            font-size: 22px;
            text-align: center;
            min-height: 30px;
            min-width: 100%;
            background: rgb(66, 96, 96);
        }

        > * + * {
            margin-top: $interiorMargin;
        }

        .temp-toolbar {
            flex: 0 0 auto;
        }

        &__container-holder {
            // Holds containers
            display: flex;
            flex: 1 1 auto;

            &[class*='-column'] {
               // @include test(blue);
                flex-direction: column;

                > * + * {
                    margin-top: 1px;
                }
            }

            &[class*='-row'] {
               // @include test(red);
                flex-direction: row;

                > * + * {
                    margin-left: 1px;
                }
            }
        }

        &__container {
            background: $editColorBg;
            flex: 1 1 auto;
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
            isDragging: false
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
