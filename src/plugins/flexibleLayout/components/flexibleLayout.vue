<template>
    <div class="flexible-layout-container">
        <div class="header" 
             v-if="isEditing"
             @click="addContainer">
            Add a new Container
        </div>

        <div class="body">
            <container-component
                 v-for="(container, index) in containers"
                 :key="index"
                 :index="index"
                 :minWidth="container.width || `${100/containers.length}%`"
                 :frames="container.frames"
                 :isEditing="isEditing"
                 @addFrame="addFrame"
                 @object-drag-from="dragFromHandler"
                 @object-drop-to="dropToHandler">
            </container-component>
        </div> 
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base.scss';

    .flexible-layout-container {
        display: flex;
        flex-direction: column;
        .header {
            font-size: 22px;
            text-align: center; 
            min-height: 30px;
            min-width: 100%;
            background: rgb(66, 96, 96);

            &:hover{
                cursor: pointer;
            }
        }

        .body {
            min-width: 100%;
            min-height: 85vh;
            max-height: 85vh;
            display: flex;
            flex-direction: row;
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

        return {
            containers: containers,
            dragFrom: [],
            isEditing: false
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
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.isEditingHandler);
    }
}
</script>
