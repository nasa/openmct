<template>
<div
    class="c-fault-mgmt"
>
    <FaultManagementListView
        :faults-list="faultsList"
    />
</div>
</template>

<script>
import FaultManagementListView from './FaultManagementListView.vue';

import uuid from 'uuid';

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
                this.faultsList = data.alarms.map(alarm => {
                    alarm.key = uuid();

                    return alarm;
                });
            });

        this.unsubscribe = this.openmct.telemetry
            .subscribe(this.domainObject, this.updateFault);
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    },
    methods: {
        updateFault(fault) {
            fault.key = uuid();
            this.faultsList.push(fault);
        }
    }
};
</script>
