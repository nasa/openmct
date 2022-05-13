<template>
<div>
    <div
        v-for="fault of selectedFaults"
        :key="name(fault)"
    >
        <div class="c-fault-mgmt__list-name">Name: {{ name(fault) }}</div>
        <div class="c-fault-mgmt__list-trigTime">Trip Value: {{ triggerValue(fault) }}</div>
        <div class="c-fault-mgmt__list-curVal">Live value: {{ currentValue(fault) }}</div>
    </div>
</div>
</template>

<script>
export default {
    name: 'FaultManagementInspector',
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
        currentValue(fault) {
            return fault?.parameterDetail?.currentValue?.engValue?.doubleValue;
        },
        name(fault) {
            return `${fault?.id?.name}/${fault?.id?.namespace}`;
        },
        updateSelectedFaults() {
            const selection = this.openmct.selection.get();
            if (selection.length === 0 || selection[0].length < 2) {
                return;
            }

            this.selectedFaults = selection[0][1].context.selectedFaults;
        },
        triggerValue(fault) {
            return fault?.parameterDetail?.triggerValue?.engValue?.doubleValue;
        }
    }
};
</script>
