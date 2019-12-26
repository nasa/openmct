<template>
<div id="conditionArea"
     class="c-cs-editui__conditions widget-condition"
>
    <span v-if="isEditing">[editable condition data]</span>
    <span v-else>[read-only condition data]</span>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            conditionData: {}
        };
    },
    methods: {
    }
}
</script>
