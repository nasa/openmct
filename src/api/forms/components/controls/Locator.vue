<template>
<SelectorDialogTree :hide-title="true"
                    :ignore-type-check="true"
                    :css-class="`form-locator c-form-control--locator`"
                    :parent="model.parent"
                    @treeItemSelected="handleItemSelection"
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
        handleItemSelection({ item, parentObjectPath }) {
            const data = {
                model: this.model,
                value: item,
                parentObjectPath
            };

            this.$emit('onChange', data);
        }
    }
};
</script>
