<template>
<div class="c-fault-manager">
    Fault Managment
    <FaultsListView />
</div>
</template>

<script>
import FaultsListView from './FaultsListView.vue';

export default {
    components: {
        FaultsListView
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
        };
    },
    computed: {
    },
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
    }
};
</script>
