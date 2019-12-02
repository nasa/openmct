<template>
    <dialog-component>
        <progress-component :model="model"></progress-component>
    </dialog-component>
</template>

<style lang="scss">
</style>

<script>
import ProgressComponent from '../../../ui/components/ProgressBar.vue';
import DialogComponent from './DialogComponent.vue';

export default {
    components: {
        DialogComponent: DialogComponent,
        ProgressComponent: ProgressComponent,
    },
    inject:['iconClass', 'title', 'hint', 'timestamp', 'message'],
    props:['model']
}
</script>
