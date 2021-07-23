<template>
<SelectorDialogTree :hide-title="true"
                    :ignore-type-check="true"
                    :css-class="`form-locator c-form-control--locator`"
                    :parent="model.parent"
                    @conditionSetSelected="handleItemSelection"
/>
</template>

<script>
import SelectorDialogTree from '@/ui/components/SelectorDialogTree.vue';

export default {
    components: {
        SelectorDialogTree
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
    destroyed() {
    },
    methods: {
        handleItemSelection(parentDomainObject) {
            const data = {
                model: this.model,
                value: parentDomainObject
            };
            this.$emit('onChange', data);
        }
    }
};
</script>
