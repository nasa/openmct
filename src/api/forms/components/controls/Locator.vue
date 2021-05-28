<template>
    <ConditionSetSelectorDialog
        :hideTitle="true"
        :ignoreTypeCheck="true"
        :cssClass="`form-locator`"
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
           const data = { model: this.model, parentDomainObject };
           this.$emit('onChange', data);
       }
    }
};
</script>
