<template>
<div class="c-fault-mgmt">
    <FaultManagementListView />
</div>
</template>

<script>
import FaultManagementListView from './FaultManagementListView.vue';

export default {
    components: {
        FaultManagementListView
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
        };
    },
    computed: {
    },
    mounted() {
        console.log('mounted', this.domainObject);
        this.openmct.telemetry.request(this.domainObject).then(data => {
            console.log('after request', data);
        });
    },
    beforeDestroy() {
    },
    methods: {
    }
};
</script>
