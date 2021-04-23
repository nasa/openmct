<template>
    <ConditionSetSelectorDialog
        :hideTitle="true"
        :ignoreTypeCheck="true"
        @conditionSetSelected="handleItemSelection"
    />
</template>

<script>
import ConditionSetSelectorDialog from '@/plugins/condition/components/inspector/ConditionSetSelectorDialog.vue';

export default {
    components: {
        ConditionSetSelectorDialog
    },
    inject: ['openmct'],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
        };
    },
    computed: {

    },
    watch: {

    },
    mounted() {

    },
    destroyed() {

    },
    methods: {
       handleItemSelection(parentDomainObject) {
           const data = { parentDomainObject };
           this.$emit('onChange', data);
       }
    }
};
</script>
