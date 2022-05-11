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
import { FAULT_MANAGEMENT_ALARMS, FAULT_MANAGEMENT_GLOBAL_ALARMS } from './constants';

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
        this.updateFaultList();


        this.unsubscribe = this.openmct.telemetry
            .subscribe(this.domainObject, this.updateFault);
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    },
    methods: {
        generateKey(fault) {
            return `id-${fault.id.name}-${fault.id.namespace}`;
        },
        updateFaultList() {
            this.openmct.telemetry
                .request(this.domainObject)
                .then(data => {
                    this.faultsList = data.alarms.map(fault => {
                        fault.key = this.generateKey(fault);

                        return fault;
                    });
                });
        },
        updateFault({ fault, type }) {
            if (type === FAULT_MANAGEMENT_GLOBAL_ALARMS) {
                this.updateFaultList();
            } else if (type === FAULT_MANAGEMENT_ALARMS) {
                const key = this.generateKey(fault);

                this.faultsList.forEach((faultValue, i) => {
                    if (key === faultValue.key) {
                        fault.key = key;
                        this.$set(this.faultsList, i, fault);
                    }
                });
            }
        }
    }
};
</script>
