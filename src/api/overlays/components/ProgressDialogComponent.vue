<template>
<dialog-component>
    <progress-component :model="model" />
</dialog-component>
</template>

<script>
import ProgressComponent from '../../../ui/components/ProgressBar.vue';
import DialogComponent from './DialogComponent.vue';

export default {
    components: {
        DialogComponent: DialogComponent,
        ProgressComponent: ProgressComponent
    },
    inject: ['iconClass', 'title', 'hint', 'timestamp', 'message'],
    props: {
        model: {
            type: Object,
            required: true
        }
    }
};
</script>
