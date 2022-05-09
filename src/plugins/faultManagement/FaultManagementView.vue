<template>
<div class="c-fault-mgmt">
    <FaultManagementListView
        :faults-list="faultsList"
    />
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
            faultsList: []
        };
    },
    computed: {
    },
    mounted() {
        this.openmct.telemetry
            .request(this.domainObject)
            .then(data => {
                this.faultsList = data.alarms;
            });
    },
    beforeDestroy() {
    },
    methods: {
    }
};
</script>
