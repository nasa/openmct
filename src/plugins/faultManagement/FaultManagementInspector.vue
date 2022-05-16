<template>
<div class="c-inspector__properties c-inspect-properties">
    <div class="c-inspect-properties__header">
        Source
    </div>
    <ul
        v-for="fault of selectedFaults"
        :key="name(fault)"
        class="c-inspect-properties__section"
    >
        <DetailText :detail="{ name: 'Name', value: name(fault) }" />
        <DetailText :detail="{ name: 'Trip Value', value: triggerValue(fault)}" />
        <DetailText :detail="{ name: 'Live value', value: currentValue(fault)}" />
    </ul>
</div>
</template>

<script>
import DetailText from '@/ui/inspector/details/DetailText.vue';

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
