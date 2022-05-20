<template>
<div
    v-if="selectedFaults.length === 1"
    class="c-inspector__properties c-inspect-properties"
>
    <div class="c-inspect-properties__header">Fault Details</div>
        <ul
            v-for="(fault) of selectedFaults"
            :key="name(fault, uuid())"
            class="c-inspect-properties__section"
        >
            <DetailText :detail="{ name: 'Source', value: name(fault) }" />
            <DetailText :detail="{ name: 'Occured', value: triggerTime(fault)}"/>
            <DetailText :detail="{ name: 'Criticality', value: severity(fault)}"/>
            <DetailText :detail="{ name: 'Description', value: description(fault)}" />
        </ul>

    <div class="c-inspect-properties__header">Telemetry</div>
        <ul
            v-for="fault of selectedFaults"
            :key="name(fault, uuid())"
            class="c-inspect-properties__section"
        >
            <DetailText :detail="{ name: 'System', value: pathname(fault) }" />
            <DetailText :detail="{ name: 'Trip Value', value: triggerValue(fault)}" />
            <DetailText :detail="{ name: 'Live value', value: currentValue(fault)}" />
        </ul>
    </div>
</template>

<script>
import DetailText from '@/ui/inspector/details/DetailText.vue';

import uuid from 'uuid';

export default {
    name: 'FaultManagementInspector',
    components: {
        DetailText
    },
    inject: ['openmct', 'selection'],
    props: {
    },
    data: function () {
        return {
            selectedFaults: []
        };
    },
    computed: {
    },
    watch: {
    },
    destroyed() {
    },
    mounted() {
        this.updateSelectedFaults();
    },
    methods: {
        uuid: uuid,
        currentValue(fault) {
            return fault?.parameterDetail?.currentValue?.engValue?.doubleValue;
        },
        entireName(fault) {
            return `${fault?.id?.name}/${fault?.id?.namespace}`;
        },
        name(fault, uuid = ''){
            return fault?.id?.name + uuid;
        },
        pathname(fault){
            return fault?.id?.namespace;
        },
        severity(fault) {
            return fault?.severity;
        },
        updateSelectedFaults() {
            const selection = this.openmct.selection.get();
            if (selection.length === 0 || selection[0].length < 2) {
                return;
            }

            this.selectedFaults = selection[0][1].context.selectedFaults;
        },
        triggerTime(fault) {
            return fault?.triggerTime;
        },
        triggerValue(fault) {
            return fault?.parameterDetail?.triggerValue?.engValue?.doubleValue;
        },
        description(fault){
            return fault?.parameterDetail?.parameter?.shortDescription;
        }
    }
};
</script>
